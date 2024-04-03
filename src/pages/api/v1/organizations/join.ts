import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Invitation, Organization, User } from '@/types';

// @ts-ignore
const mergicianOptions = { appendArrays: true, dedupArrays: true };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const organizations = db.collection('organizations');
  const invitations = db.collection('invitations');

  // Joining an organization with an invite code
  if (req.method === 'POST') {
    let { code: inviteCode } = req.body as {
      code: string;
    };

    if (inviteCode !== undefined) {
      inviteCode = inviteCode.trim();
    }

    const inviteCodeData = (await invitations.findOne({
      type: 'organization',
      code: inviteCode
    })) as Invitation | null;

    if (!inviteCodeData || (inviteCodeData.maxUses > 0 && inviteCodeData.uses >= inviteCodeData.maxUses)) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'This invite code is invalid. Please try again.'
      });
    }

    const organization = (await organizations.findOne({
      id: inviteCodeData.organizationId
    })) as Organization | null;

    if (!organization) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'This invite code is invalid. Please try again.'
      });
    }

    // Check if the user is already in the organization
    if (organization.members[uid]) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'You are already in this organization.'
      });
    }

    const timestamp = new Date();

    // Log the user joining
    await organizations.updateOne(
      { id: organization.id },
      {
        $push: {
          logs: {
            type: 'user-joined',
            performer: inviteCodeData.createdBy,
            target: uid,
            timestamp: timestamp
          }
        }
      }
    );

    // check if the user joining already has a roblox account in the organization
    const user = (await db
      .collection('users')
      .findOne({ id: uid }, { projection: { id: 1, roblox: 1 } })) as User | null;
    if (!user) return res.status(404).json({ message: 'User not found' });

    const robloxMember = Object.values(organization.members).find(
      (member) => member.type === 'roblox' && member.id.toString() === user.roblox.id?.toString()
    );
    if (robloxMember) {
      // roblox user found, migrate their data and remove the old roblox member
      await organizations.updateOne(
        { id: organization.id },
        {
          $set: {
            [`members.${uid}`]: {
              ...robloxMember,
              type: 'user',
              id: uid,
              formattedId: uid,
              role: inviteCodeData.role || 1,
              joinedAt: timestamp,
              updatedAt: timestamp
            }
          },
          $unset: {
            [`members.${robloxMember.id}`]: ''
          }
        }
      );
    } else {
      // roblox user not found, add them the normal way
      await organizations.updateOne(
        { id: organization.id },
        {
          $set: {
            [`members.${uid}`]: {
              type: 'user',
              id: uid,
              formattedId: uid,
              role: inviteCodeData.role || 1,
              accessGroups: [],
              joinedAt: timestamp,
              updatedAt: timestamp
            }
          }
        }
      );
    }

    // increment invite code uses
    await invitations.updateOne(
      { code: inviteCode },
      {
        $inc: {
          uses: 1
        }
      }
    );

    return res.status(200).json({
      message: `Successfully joined ${organization.name}!`,
      success: true,
      organizationId: organization.id
    });
  }

  return res.status(500).json({ message: 'An unknown error has occurred.' });
}
