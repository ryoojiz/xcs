import { NextApiRequest, NextApiResponse } from 'next';
import { generate } from 'randomstring';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Invitation } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { senderId, maxUses, code, comment, referrals } = req.body;

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

  if (req.method === 'POST') {
    code =
      code ||
      generate({
        length: 8,
        charset: 'alphanumeric'
      });

    maxUses = maxUses || 1;
    if (maxUses < 1) {
      return res.status(400).json({
        success: false,
        message: 'Max uses must be greater than or equal to 1.'
      });
    }

    comment = comment.trim() || '';

    if (comment.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'A comment is required.'
      });
    }

    if (comment.length > 64) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be less than or equal to 64 characters.'
      });
    }

    const checkExisting = await invitations.findOne({ inviteCode: code });
    if (checkExisting) {
      return res.status(400).json({
        success: false,
        message: 'This invite code is taken.'
      });
    }

    const result = await invitations.insertOne({
      type: 'xcs',
      code: code,
      isSponsor: false,

      uses: 0,
      maxUses: maxUses,

      startingReferrals: referrals || 0,
      comment: comment,
      createdAt: new Date().toISOString(),
      createdBy: senderId || user.id,
    } as Invitation);

    return res.status(200).json({
      success: true,
      message: 'Successfully created invite link.',
      code: code
    });
  }
}
