import { tokenToID } from '@/pages/api/firebase';
import { NextApiRequest, NextApiResponse } from 'next';
import { generate as generateString } from 'randomstring';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // roblox-side, generate a code for the user.
  if (req.method === 'GET') {
    const uid = await authToken(req);
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB as string);
    const codes = db.collection('verificationCodes');

    const fetchCode = await codes.findOne({ id: uid }, { projection: { code: 1 } });

    // if a code already exists, return it
    if (fetchCode) {
      return res.status(200).json({ success: true, code: fetchCode.code });
    } else {
      // create a new code if one doesn't already exist, and make sure it's unique
      let new_code = null;
      do {
        new_code = await generateString({
          length: 6,
          readable: true,
          charset: 'alphanumeric',
          capitalization: 'uppercase'
        });
      } while (await codes.findOne({ code: new_code }, { projection: { _id: 1 } }));

      await codes.insertOne({ id: uid, code: new_code, createdAt: new Date() });
      res.status(200).json({ success: true, code: new_code });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
