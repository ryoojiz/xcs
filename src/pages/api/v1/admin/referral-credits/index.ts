import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { recipientId, referrals } = req.body;

  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const users = db.collection('users');
  const invitations = db.collection('invitations');
  const user = await users.findOne({ id: uid });

  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (!user.platform.staff) return res.status(403).json({ message: 'Forbidden.' });

  const recipient = await users.findOne({ id: recipientId || user.id });

  if (!recipient) return res.status(404).json({ message: 'Recipient not found.' });

  if (req.method === 'POST') {
    const result = await users
      .updateOne(
        { id: recipient.id || user.id },
        {
          $inc: {
            'platform.invites': referrals || 1
          }
        }
      )
      .then(() => true)
      .catch(() => false);

    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'An error occurred while adding referral credits.'
      });
    } else {
      return res.status(200).json({
        success: true,
        message: `Successfully added ${referrals || 1} referral credit${referrals === 1 ? '' : 's'} to ${
          recipient.displayName || user.displayName
        }.`
      });
    }
  }
}
