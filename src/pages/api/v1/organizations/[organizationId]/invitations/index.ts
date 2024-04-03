import { NextApiRequest, NextApiResponse } from 'next';
import { generate as generateString } from 'randomstring';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { OrganizationMember } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { organizationId } = req.query as {
    organizationId: string;
  };

  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const organizations = db.collection('organizations');
  const users = db.collection('users');

  let organization = (await organizations.findOne({
    id: organizationId
  })) as any;

  if (!organization) {
    return res.status(404).json({ message: 'Organization not found' });
  }

  if (!organization.members[uid]) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const id = generateString({ length: 16, charset: 'alphanumeric' });

  const member = organization.members[uid] as OrganizationMember;
  if (member.role < 2 && !member.permissions?.organization.members.create) {
    return res.status(403).json({
      message: "You don't permission to view this organization's invitations.",
      success: false
    });
  }
  if (req.method === 'GET') {
    let invitations = await db.collection('organizationInvitations').find({ organizationId }).toArray();
    for (let invitation in invitations) {
      invitations[invitation].recipient = await db.collection('users').findOne(
        { id: invitations[invitation].recipientId },

        { projection: { _id: 0, id: 1, displayName: 1, username: 1, avatar: 1 } }
      );
      invitations[invitation].createdBy = await db
        .collection('users')
        .findOne(
          { id: invitations[invitation].createdById },
          { projection: { _id: 0, id: 1, username: 1, displayName: 1, avatar: 1 } }
        );
    }

    return res.status(200).json(invitations || []);
  } else if (req.method === 'DELETE') {
    const { id } = req.body as { id: string };
    if (!id) return res.status(400).json({ message: 'Missing ID.' });

    await db.collection('organizationInvitations').deleteOne({ id });

    return res.status(200).json({ success: true });
  }

  return res.status(500).json({ message: 'Internal server error.' });
}
