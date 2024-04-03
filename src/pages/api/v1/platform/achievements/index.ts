import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Achievement, User } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { achievementId, id, revoke } = req.body;
  achievementId = decodeURIComponent(achievementId as string);

  const uid = await authToken(req);
  // if (!uid) {
  //   return res.status(401).json({ message: 'Unauthorized.' });
  // }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  // if (!user.platform.staff) return res.status(403).json({ message: 'Forbidden.' });

  if (req.method === 'GET') {
    const result = (await db
      .collection('achievements')
      .find({}, { projection: { _id: 0 } })
      .toArray()) as unknown as Achievement[];
    return res.status(200).json(result);
  } else if (req.method === 'POST') {
    const self = (await db
      .collection('users')
      .findOne({ id: uid }, { projection: { id: 1, platform: 1 } })) as unknown as User | null;
    if (!self?.platform?.staff) return res.status(403).json({ message: 'Forbidden.' });

    const recipient = (await db.collection('users').findOne({ id: id || uid })) as User | null;
    if (!recipient) return res.status(404).json({ message: 'User not found.' });

    if (revoke) {
      if (!Object.values(recipient.achievements || {})?.find((a) => a.id === achievementId)) {
        return res.status(409).json({ message: 'User already does not have the award specified.' });
      }

      await db.collection('users').updateOne(
        { id: id || uid },
        {
          $unset: {
            [`achievements.${achievementId}`]: ''
          }
        }
      );
      return res.status(200).json({ message: `Achievement revoked from ${recipient.displayName || 'user'}.` });
    } else {
      const achievement = await db.collection('achievements').findOne({ id: achievementId });
      if (!achievement) return res.status(404).json({ message: 'Achievement not found.' });

      if (Object.values(recipient.achievements || {})?.find((a) => a.id === achievementId)) {
        return res.status(409).json({ message: 'Achievement already awarded.' });
      }

      await db.collection('users').updateOne(
        { id: id || uid },
        {
          $set: {
            [`achievements.${achievementId}`]: {
              id: achievementId,
              earnedAt: new Date()
            }
          }
        }
      );

      return res.status(200).json({ message: `Achievement awarded to ${recipient.displayName || 'user'}.` });
    }
  }
  return res.status(405).json({ message: 'Method not allowed.' });
}
