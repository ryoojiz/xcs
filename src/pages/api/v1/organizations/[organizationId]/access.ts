import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Organization } from '@/types';

export const config = {
  api: {
    responseLimit: '16mb',
    bodyParser: {
      sizeLimit: '16mb'
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Organization ID
  const { organizationId } = req.query as { organizationId: string };

  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const organizations = db.collection('organizations');
  const locations = db.collection('locations');
  const users = db.collection('users');
  let canEdit = false;

  let organization = (await organizations.findOne(
    { id: organizationId },
    {
      projection: {
        id: 1,
        name: 1,
        description: 1,
        avatar: 1,
        ownerId: 1,
        members: 1,
        createdAt: 1,
        updatedAt: 1,
        verified: 1,
        isPersonal: 1
      }
    }
  )) as unknown as Organization;

  if (!organization) {
    return res.status(404).json({ message: 'Organization not found' });
  }

  if (uid && organization.members[uid] && organization.members[uid].role > 0) {
    canEdit = true;
  }

  if (req.method === 'GET') {
    const self = uid ? organization.members[uid] : null;

    return res.status(200).json({
      member: self,
      edit: canEdit
    });
  }

  return res.status(500).json({
    message: 'An unknown errror occurred. If this error persists, please contact customer support.'
  });
}
