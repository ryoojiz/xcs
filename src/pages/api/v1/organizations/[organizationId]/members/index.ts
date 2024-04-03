import { NextApiRequest, NextApiResponse } from 'next';
import { generate as generateString } from 'randomstring';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { RobloxUserByUsernamesResponseValue, getRobloxUsersByUsernames } from '@/lib/utils';
import { Organization, OrganizationInvitation, OrganizationMember, User } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // params
  const { organizationId } = req.query as {
    organizationId: string;
  };

  // validate authorization header
  const uid = await authToken(req);
  if (!uid) return res.status(401).json({ message: 'Unauthorized.' });

  // database
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const organizations = db.collection('organizations');
  const users = db.collection('users');

  let organization = (await organizations.findOne({
    id: organizationId
  })) as unknown as Organization;

  if (!organization) return res.status(404).json({ message: 'Organization not found' });

  // check if self is in the organization
  const selfMember = organization.members[uid];
  if (!selfMember) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const timestamp = new Date();

  interface Body {
    type: 'user' | 'roblox' | 'roblox-group' | 'card';
    name?: string;

    role?: number;

    id?: string;
    username?: string;
    cardNumbers?: string[];
    robloxGroupId?: number;
    robloxGroupRoles?: number[];

    accessGroups: string[];
  }

  let { type, role, name, id, robloxGroupId, robloxGroupRoles, username, cardNumbers, accessGroups } = req.body as Body;

  if (!type) return res.status(400).json({ message: 'Missing type.' });

  if (req.method === 'POST') {
    // check if self has edit permissions
    if (selfMember.role < 2 && !selfMember.permissions?.organization.members.create) {
      return res.status(403).json({
        message: "You don't have edit permissions.",
        success: false
      });
    }

    // regular XCS user
    // in this case, create an invitation for the user to join the organization
    if (type === 'user') {
      if (!id?.trim()) return res.status(400).json({ message: 'Missing user.' });
      if (!role) role = 1; // default role is 1 (member)
      if (role < 0 || role > 3) return res.status(400).json({ message: 'Invalid role.' });

      // search for the user in the database
      const user = (await users.findOne({ id: id })) as User | null;
      if (!user) return res.status(404).json({ message: 'A user was not found with the username provided.' });

      if (user.id === uid) {
        return res.status(400).json({
          message: "You can't invite yourself to the organization.",
          success: false
        });
      }

      // check if the user is already in the organization
      if (organization.members[user.id]) {
        return res.status(409).json({
          message: `This user is already in the organization.`,
          success: false
        });
      }

      // check if the user has already been invited
      const invitation = (await db
        .collection('organizationInvitations')
        .findOne({ organizationId: organizationId, recipientId: user.id })) as OrganizationInvitation | null;
      if (invitation) {
        const invitedBy = (await users.findOne({ id: invitation.createdById }, { projection: { displayName: 1 } })) as {
          displayName: string;
        } | null;
        return res.status(409).json({
          message: `This user has already been invited to the organization by ${invitedBy?.displayName || 'someone'}.`,
          success: false
        });
      }

      // create an invitation
      await db.collection('organizationInvitations').insertOne({
        id: generateString({
          length: 16,
          charset: 'alphanumeric'
        }),
        recipientId: user.id,
        organizationId: organizationId,
        createdById: uid,
        createdAt: timestamp,
        role: role,
        comment: name?.trim() || undefined,
        accessGroups: accessGroups,
        expiresAt: -1
      } as OrganizationInvitation);

      return res.status(200).json({
        success: true,
        message: `Successfully invited ${user.displayName} to the organization.`
      });
    } else if (type === 'roblox') {
      if (!username?.trim()) return res.status(400).json({ message: 'Missing username.' });

      // get roblox username
      let robloxUsers = (await getRobloxUsersByUsernames([username as string])) as RobloxUserByUsernamesResponseValue[];
      if (!robloxUsers.length) return res.status(404).json({ message: 'Roblox user not found.' });

      const robloxId = robloxUsers[0].id; // get roblox id, there will always be one user in the array
      const user = (await users.findOne({ 'roblox.id': robloxId.toString() })) as User | null;

      if (selfMember.role < 2 && !selfMember.permissions?.organization.members.create) {
        return res.status(403).json({
          message: "You don't have edit permissions.",
          success: false
        });
      }

      // check if a regular user with the roblox id linked is already in the organization
      if (user && organization.members[user.id]) {
        return res.status(409).json({
          message: `This user is already in the organization as ${user.displayName}.`,
          success: false
        });
      }

      // check if the roblox id is already in the organization
      if (
        Object.values(organization.members).find(
          (member: OrganizationMember) => member.id === robloxId.toString() && member.type === 'roblox'
        )
      ) {
        return res.status(409).json({
          message: 'This user is already in the organization.',
          success: false
        });
      }

      // add the roblox user to the organization
      organizations.updateOne(
        { id: organizationId },
        {
          $set: {
            [`members.${robloxId}`]: {
              type: 'roblox',
              id: robloxId.toString(),
              role: 0,

              formattedId: robloxId.toString(),
              accessGroups: accessGroups,
              scanData: {},

              joinedAt: timestamp,
              updatedAt: timestamp
            } as OrganizationMember
          }
        }
      );
      return res.status(200).json({
        success: true,
        message: `Successfully added ${robloxUsers[0].name} to the organization.`
      });
    } else if (type === 'roblox-group') {
      if (!robloxGroupId) return res.status(400).json({ message: 'Missing group.' });

      if (organization.members[uid].role < 2) {
        return res.status(403).json({
          message: "You don't have edit permissions.",
          success: false
        });
      }
      const robloxGroup = await fetch(`https://groups.roblox.com/v1/groups/${robloxGroupId}`).then((res) => res.json());
      if (!robloxGroup) return res.status(404).json({ message: 'Roblox group not found.' });

      if (
        Object.values(organization.members).find(
          (member: any) =>
            member.type === 'roblox-group' && member.id === robloxGroupId && member.groupRoles === robloxGroupRoles
        )
      ) {
        return res.status(409).json({
          message: 'This group/roleset is already in the organization.',
          success: false
        });
      }
      const randomString = generateString({
        length: 16,
        charset: 'alphanumeric'
      });

      const memberId = `RG-${robloxGroupId}-${randomString}`;
      organizations.updateOne(
        { id: organizationId },
        {
          $set: {
            [`members.${memberId}`]: {
              type: 'roblox-group',
              id: robloxGroupId.toString(),
              formattedId: `${memberId}`,
              name: name?.trim() || robloxGroup.name,
              role: 0,
              scanData: {},

              groupName: robloxGroup.name,
              groupRoles: robloxGroupRoles,

              accessGroups: accessGroups,

              joinedAt: timestamp,
              updatedAt: timestamp
            }
          }
        }
      );
      return res.status(200).json({
        success: true,
        message: `Successfully added ${robloxGroup.name} to the organization.`
      });
    } else if (type === 'card') {
      if (!name?.trim()) return res.status(400).json({ message: 'Missing name.' });

      if (organization.members[uid].role < 2) {
        return res.status(403).json({
          message: "You don't have edit permissions.",
          success: false
        });
      }

      const randomString = generateString({
        length: 16,
        charset: 'alphanumeric'
      });

      const memberId = `CARD-${randomString}`;
      organizations.updateOne(
        { id: organizationId },
        {
          $set: {
            [`members.${memberId}`]: {
              type: 'card',
              avatar: `${process.env.NEXT_PUBLIC_ROOT_URL}/images/default-avatar-card.png`,
              id: memberId,
              formattedId: `${memberId}`,
              name: name?.trim(),
              role: 0,
              scanData: {},
              cardNumbers: (cardNumbers || []).sort(),

              accessGroups: accessGroups,

              joinedAt: timestamp,
              updatedAt: timestamp
            }
          }
        }
      );
      return res.status(200).json({
        success: true,
        message: `Successfully added ${name} to the organization.`
      });
    }
  } else if (req.method === 'GET') {
    let members = Object.values(organization.members);
    return res.status(200).json(members);
  }

  return res.status(400).json({ message: 'Method not allowed.' });
}
