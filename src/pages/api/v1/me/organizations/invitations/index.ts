import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { OrganizationInvitation, OrganizationMember } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uid = await authToken(req);
  if (!uid) return res.status(401).json({ message: 'Unauthorized.' });

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);

  if (req.method === 'GET') {
    let invitations = await db.collection('organizationInvitations').find({ recipientId: uid }).toArray();

    for (let invitation in invitations) {
      invitations[invitation].organization = await db.collection('organizations').findOne(
        { id: invitations[invitation].organizationId },

        { projection: { _id: 0, id: 1, name: 1, createdBy: 1, avatar: 1 } }
      );
      invitations[invitation].createdBy = await db
        .collection('users')
        .findOne(
          { id: invitations[invitation].createdById },
          { projection: { _id: 0, id: 1, username: 1, displayName: 1, avatar: 1 } }
        );
    }

    return res.status(200).json(invitations);
  } else {
    return res.status(405).json({ message: 'Method not allowed.' });
  }
}
