import { tokenToID } from '@/pages/api/firebase';
import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { getRobloxUsers } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { query } = req.query;
  query = decodeURIComponent(query as string);

  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const users = db.collection('users');
  const user = await users.findOne({ id: uid });

  if (!user) return res.status(404).json({ message: 'User not found.' });
  // if (!user.platform.staff) return res.status(403).json({ message: 'Forbidden.' });

  if (req.method === 'GET') {
    const result = await users
      .find(
        {
          $or: [
            { username: { $regex: query as string, $options: 'i' } },
            { displayName: { $regex: query as string, $options: 'i' } },
            { email: { $regex: query as string, $options: 'i' } }
          ]
        },
        {
          projection: {
            _id: 0,
            id: 1,
            username: 1,
            displayName: 1,
            avatar: 1
          }
        }
      )
      .limit(10)
      .toArray();

    return res.status(200).json(result);
  }
}
