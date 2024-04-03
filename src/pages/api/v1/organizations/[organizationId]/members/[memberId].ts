import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Organization, OrganizationMember } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // params
  const { organizationId, memberId } = req.query as {
    organizationId: string;
    memberId: string;
  };

  // validate authorization header
  const uid = await authToken(req);
  if (!uid) return res.status(401).json({ message: 'Unauthorized.' });

  // database
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);

  const organizations = db.collection('organizations');
  const users = db.collection('users');
  const accessPoints = db.collection('accessPoints');

  // data gets mutated later on so we need to cast it to unknown first
  let organization = (await organizations.findOne({
    id: organizationId
  })) as unknown as Organization;

  if (!organization) return res.status(404).json({ message: 'Organization not found.' });

  const member = organization.members[memberId] as OrganizationMember;
  const selfMember = organization.members[uid] as OrganizationMember;
  if (!member) return res.status(401).json({ message: 'Unauthorized.' });

  const user = await users.findOne({ id: memberId });
  const timestamp = new Date();

  let { name, role, accessGroups, groupRoles, scanData, cardNumbers } = req.body as {
    name?: string;
    role: number;
    accessGroups: string[];
    groupRoles?: string[];
    scanData: string;
    cardNumbers?: string[];
  };

  if (role !== member?.role && member?.role >= 3) {
    return res.status(403).json({
      message: 'User is the owner of the organization.',
      success: false
    });
  }

  if (req.method === 'PATCH') {
    role = parseInt(role.toString());

    if (selfMember.role < 2) {
      return res.status(403).json({
        message: "You don't have edit permissions.",
        success: false
      });
    }

    if (role !== member?.role && role === 3) {
      return res.status(403).json({
        message: 'You cannot grant ownership.',
        success: false
      });
    }

    if (member?.role > selfMember.role) {
      return res.status(403).json({
        message: 'You cannot edit a user with a higher role than you.',
        success: false
      });
    }

    if (role !== member.role && selfMember.role <= member.role) {
      return res.status(403).json({
        message: "You cannot edit a user's role when they're an equal or higher role than you.",
        success: false
      });
    }

    try {
      scanData = JSON.parse(scanData);
    } catch (err) {
      return res.status(400).json({
        message: 'Unable to parse scan data. Check your JSON and try again.'
      });
    }

    // remove all access groups that don't exist
    accessGroups = accessGroups.filter((accessGroupId: string) => {
      return Object.keys(organization.accessGroups).includes(accessGroupId);
    });

    organizations.updateOne(
      { id: organizationId },
      {
        $set: {
          [`members.${memberId}.name`]: name || user?.displayName || user?.groupName || 'Untitled',
          [`members.${memberId}.role`]: role,
          [`members.${memberId}.groupRoles`]: groupRoles !== undefined ? groupRoles : undefined,
          [`members.${memberId}.cardNumbers`]: cardNumbers !== undefined ? cardNumbers.sort() : undefined,
          [`members.${memberId}.accessGroups`]: accessGroups,
          [`members.${memberId}.scanData`]: scanData || {},
          [`members.${memberId}.updatedAt`]: timestamp
        }
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully saved changes.`,
      id: user?.id
    });
  }

  // remove member from the organization
  if (req.method === 'DELETE') {
    if (selfMember.role < 2) {
      return res.status(403).json({
        message: "You don't have edit permissions.",
        success: false
      });
    }

    // member is a regular XCS user
    if (member.type === 'user') {
      if (member.role >= selfMember.role) {
        return res.status(403).json({
          message: 'You cannot remove a user with an equal or higher role than you.',
          success: false
        });
      }

      const user = await users.findOne({ id: member.id }, { projection: { roblox: 1 } });
      const userAccessPoints = await accessPoints.updateMany(
        {
          organizationId: organizationId,
          'config.alwaysAllowed.members': { $in: [member.id, user?.roblox?.id || 0] }
        },
        { $pull: { 'config.alwaysAllowed.members': { $in: [member.id, user?.roblox?.id || 0] } } } as any
      );

      await organizations.updateOne(
        { id: organizationId },
        {
          $unset: {
            [`members.${memberId}`]: ''
          }
        }
      );

      return res.status(200).json({
        message: `Successfully removed ${user?.displayName || user?.name} from the organization.`,
        success: true
      });
    } else {
      // member is a roblox user
      await organizations.updateOne(
        { id: organizationId },
        {
          $unset: {
            [`members.${memberId}`]: ''
          }
        }
      );

      let type: string;
      switch (member.type) {
        case 'roblox':
          type = 'user';
          break;
        case 'roblox-group':
          type = 'group';
          break;
        case 'card':
          type = 'cardset';
          break;
      }

      // remove member from every access point
      await db.collection('accessPoints').updateMany(
        { organizationId },
        {
          $pull: {
            [`config.alwaysAllowed.members`]: {
              $in: [memberId]
            }
          } as any
        }
      );

      return res.status(200).json({
        message: `Successfully removed ${type} from the organization.`,
        success: true
      });
    }
  }

  return res.status(500).json({ message: 'An unknown errror occurred.' });
}
