import { admin, app, tokenToID } from '@/pages/api/firebase';
import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import rateLimit from '@/lib/rate-limit';
import { User } from '@/types';

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const limiter = rateLimit({
  interval: 60 * 1000 * 15, // 15 minutes
  uniqueTokenPerInterval: 500, // max 500 users per second
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  try {
    await limiter.check(res, 2, uid) // 2 requests per 15 minutes
  } catch {
    return res.status(429).json({ error: 'Rate limit exceeded.' })
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const users = db.collection('users');
  const user = await users.findOne({ id: uid }) as User | null;

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (req.method === 'POST') {
    const adminApp = await app();

    const email = user.email.address.trim().toLowerCase();
    const email_link = await adminApp.auth().generateEmailVerificationLink(email, {
      url: `${process.env.NEXT_PUBLIC_ROOT_URL}/home`,
      handleCodeInApp: true
    }).then((link) => {
      return link;
    }).catch((error) => {
      return res.status(500).json({ success: false, message: error });
    });
    if (!email_link) {
      return res.status(500).json({ success: false, message: 'Error generating email link.' });
    }

    const msg = {
      to: email,
      from: 'xcs-noreply@restrafes.co',
      subject: 'Verify your email address',
      template_id: 'd-9dd7e88dbb554984867e7da76c9d6c6f',
      dynamic_template_data: {
        name: user.displayName,
        link: email_link
      }
    }

    await sgMail
      .send(msg)
      .then(() => {
        return res.status(200).json({ success: true, message: 'Verification email sent.' });
      })
      .catch((error: any) => {
        return res.status(500).json({ success: false, message: error });
      });

    return res.status(200).json({ success: true, message: 'Verification email sent.' });
  }
}