import { tokenToID } from '@/pages/api/firebase';
import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

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
  const accessPoints = db.collection('accessPoints');
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

  // Leave Organization
  if (req.method === 'DELETE') {
    const timestamp = new Date();

    // Reject if user is the manager
    if (organization.members[uid].role >= 3) {
      return res.status(403).json({
        message: 'You cannot leave an organization you own.',
        success: false
      });
    }

    // Remove user from all access points
    const user = await users.findOne({ id: uid }, { projection: { roblox: 1 } });
    const userAccessPoints = await accessPoints.updateMany(
      {
        organizationId: organizationId,
        'config.alwaysAllowed.members': { $in: [uid, user?.roblox?.id || 0] }
      },
      { $pull: { 'config.alwaysAllowed.members': { $in: [uid, user?.roblox?.id || 0] } } } as any
    );

    // Leave Organization
    await organizations.updateOne(
      { id: organizationId },
      {
        $unset: {
          [`members.${uid}`]: ''
        }
      }
    );

    // Log
    await organizations.updateOne(
      { id: organizationId },
      {
        $push: {
          logs: {
            type: 'member-left',
            performer: uid,
            timestamp: timestamp
          }
        }
      }
    );

    return res.status(200).json({ message: 'Successfully left organization!', success: true });
  }

  return res.status(500).json({ message: 'An unknown errror occurred.' });
}
