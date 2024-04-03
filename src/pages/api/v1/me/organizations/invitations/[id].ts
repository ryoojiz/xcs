import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Organization, OrganizationInvitation, OrganizationMember, User } from '@/types';

// @ts-ignore
import mergician from 'mergician';
const mergicianOptions = { appendArrays: true, dedupArrays: true };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  const uid = await authToken(req);
  if (!uid) return res.status(401).json({ message: 'Unauthorized.' });

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ message: 'Missing ID.' });

    const invitation = (await db
      .collection('organizationInvitations')
      .findOne({ id })) as OrganizationInvitation | null;
    if (!invitation) return res.status(404).json({ message: 'Invitation not found.' });
    if (invitation.recipientId !== uid) return res.status(401).json({ message: 'Unauthorized.' });

    await db.collection('organizationInvitations').deleteOne({ id });

    return res.status(200).json({ success: true, message: 'Successfully rejected invitation.' });
  } else if (req.method === 'POST') {
    if (!id) return res.status(400).json({ message: 'Missing ID.' });

    const invitation = (await db
      .collection('organizationInvitations')
      .findOne({ id })) as OrganizationInvitation | null;
    if (!invitation) return res.status(404).json({ message: 'Invitation not found.' });
    if (invitation.recipientId !== uid) return res.status(401).json({ message: 'Unauthorized.' });

    await db.collection('organizationInvitations').deleteOne({ id });

    // check if the user joining already has a roblox account in the organization
    const user = (await db
      .collection('users')
      .findOne({ id: uid }, { projection: { id: 1, roblox: 1 } })) as User | null;
    if (!user) return res.status(404).json({ message: 'User not found' });

    const timestamp = new Date();
    const organization = (await db
      .collection('organizations')
      .findOne({ id: invitation.organizationId })) as Organization | null;
    if (!organization) return res.status(404).json({ message: 'Organization not found.' });

    const robloxMember = Object.values(organization.members).find(
      (member) => member.type === 'roblox' && member.id.toString() === user.roblox.id?.toString()
    );
    if (robloxMember) {
      // roblox user found, migrate their data and remove the old roblox member
      await db.collection('organizations').updateOne(
        { id: organization.id },
        {
          $set: {
            [`members.${uid}`]: {
              type: 'user',
              id: uid,
              formattedId: uid,
              role: invitation.role || 1,
              accessGroups: mergician(mergicianOptions)(robloxMember.accessGroups || [], invitation.accessGroups || []),
              scanData: robloxMember.scanData || [],

              joinedAt: new Date(),
              updatedAt: new Date()
            } as OrganizationMember
          },
          $unset: {
            [`members.${robloxMember.id}`]: ''
          }
        }
      );
    } else {
      // roblox user not found, add them the normal way
      await db.collection('organizations').updateOne(
        { id: invitation.organizationId },
        {
          $set: {
            [`members.${uid}`]: {
              type: 'user',
              id: uid,
              formattedId: uid,
              role: invitation.role || 1,
              accessGroups: invitation.accessGroups || [],
              scanData: {},

              joinedAt: new Date(),
              updatedAt: new Date()
            } as OrganizationMember
          }
        }
      );
    }

    return res.status(200).json({ success: true, message: 'Successfully accepted invitation.' });
  } else {
    return res.status(405).json({ message: 'Method not allowed.' });
  }
}
