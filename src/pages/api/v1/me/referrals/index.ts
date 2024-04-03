import { NextApiRequest, NextApiResponse } from 'next';
import { generate } from 'randomstring';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Invitation, User } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const users = db.collection('users');
  const invitations = db.collection('invitations');
  const user = (await users.findOne({ id: uid })) as User | null;

  if (!user) return res.status(404).json({ message: 'User not found.' });
  // if (!user.platform.staff) return res.status(403).json({ message: 'Forbidden.' });
  if (user.platform.invites < 1) return res.status(403).json({ message: 'You have no invites left.' });

  if (req.method === 'POST') {
    // keep generating until we get a unique code
    let code;
    do {
      code = generate({
        length: 8,
        charset: 'alphanumeric'
      });
    } while (await invitations.findOne({ code: code }));

    const result = await invitations.insertOne({
      type: 'xcs',
      code: code,
      isSponsor: true,

      uses: 0,
      maxUses: 1,
      startingReferrals: 0,

      createdAt: new Date().toISOString(),
      createdBy: user.id
    } as Invitation);

    return res.status(200).json({
      success: true,
      message: 'Successfully created invite link.',
      code: code
    });
  }
}
