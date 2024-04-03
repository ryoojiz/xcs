import { admin, uploadProfilePicture } from '@/pages/api/firebase';
import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { User } from '@/types';

import sharp from 'sharp';

export const config = {
  api: {
    responseLimit: '16mb',
    bodyParser: {
      sizeLimit: '16mb'
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uid = await authToken(req);
  if (!uid) return res.status(401).json({ message: 'Unauthorized.' });

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const user = (await db.collection('users').findOne({ id: uid })) as User | null;
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const notifications = (await db
    .collection('notifications')
    .find({ recipient: uid })
    .toArray()) as unknown as Notification[];

  if (req.method === 'GET') {
    // count org invitations
    const invitationsCount = await db.collection('organizationInvitations').countDocuments({ recipientId: uid });
    return res.status(200).json({
      user: {
        ...user,
        statistics: {
          organizationInvitations: invitationsCount
        },
        notifications
      }
    });
  }
  if (req.method === 'PATCH') {
    if (!req.body) return res.status(400).json({ message: 'No body provided.' });
    let { displayName, bio, avatar, email } = req.body as any;

    if (displayName !== null) {
      displayName = displayName.trim();
      if (displayName.length > 32 || displayName.length < 3) {
        return res.status(400).json({ message: 'Display name must be between 3-32 characters.' });
      }
    }

    if (bio) {
      bio = bio.trim();
      if (bio.length >= 256) {
        return res.status(400).json({
          message: 'Bio must be less than or equal to 256 characters.'
        });
      }
    }

    const timestamp = new Date();
    req.body.lastUpdatedAt = timestamp;

    if (email) {
      email = email.trim().toLowerCase();

      // check if email is already in use
      const emailExists = await db.collection('users').findOne({ 'email.address': email });
      if (emailExists) return res.status(400).json({ message: 'Email already in use.' });

      // update email in firebase
      await admin.auth().updateUser(uid, { email: req.body.email, emailVerified: false });

      await db
        .collection('users')
        .updateOne({ id: uid }, { $set: { 'email.address': req.body.email, 'email.verified': false } });
    }

    // check if avatar is valid
    if (avatar) {
      let imageFormat = avatar.split(';')[0].split('/')[1]; // ex: jpeg
      // limit gifs for only staff
      if (imageFormat === 'gif' && !user.platform.staff) {
        return res.status(400).json({ message: 'Invalid icon format.' });
      }

      const imageData = Buffer.from(avatar.split(',')[1], 'base64');

      let image;
      if (imageFormat === 'gif') {
        image = await sharp(imageData, { animated: true })
          .resize(256, 256)
          .gif({ quality: 80, pageHeight: 256 } as any)
          .toBuffer();
      } else {
        image = await sharp(imageData).resize(256, 256).jpeg({ quality: 80 }).toBuffer();
      }
      // avatar = `data:image/jpeg;base64,${image.toString("base64")}`;

      // upload to firebase
      const url = await uploadProfilePicture('user', uid, image as any, imageFormat)
        .then((url) => {
          req.body.avatar = url;
        })
        .catch((error) => {
          console.log(error);
        });
    }

    // sanitize body to only include allowed fields
    const allowedFields = ['displayName', 'bio', 'avatar', 'emailVerified', 'lastUpdatedAt'];
    const sanitizedBody = Object.keys(req.body)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key as string] = req.body[key as string];
        return obj;
      }, {});

    await db.collection('users').updateOne({ id: uid }, { $set: sanitizedBody });
    return res.status(200).json({ message: 'Successfully updated profile.', success: true });
  }

  return res.status(500).json({ message: 'Something went really wrong. Please try again later.' });
}
