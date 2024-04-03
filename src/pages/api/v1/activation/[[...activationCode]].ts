import { admin, app } from '@/pages/api/firebase';
import { Invitation, User } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const invitations = db.collection('invitations');
  let { activationCode } = req.query as { activationCode: string };
  activationCode = decodeURIComponent(activationCode);

  const invitation = (await invitations.findOne({
    type: 'xcs',
    code: activationCode
  })) as Invitation | null;

  if (!invitation) {
    return res.status(404).json({
      valid: false,
      message: 'Invalid activation code. Please check the code and try again.'
    });
  }

  if (req.method === 'GET') {
    if (invitation?.maxUses > -1 && invitation?.uses >= invitation?.maxUses) {
      return res.status(403).json({
        valid: false,
        message: `This activation code has reached its maximum uses.`
      });
    }

    return res.status(200).json({
      valid: true,
      message: 'Valid activation code.'
    });
  }

  if (req.method === 'POST') {
    let { activationCode } = req.query as { activationCode: string };

    let { displayName, email, username, password } = req.body as {
      displayName: string;
      email: string;
      username: string;
      password: string;
    };

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB as string);
    const users = db.collection('users');

    if (invitation.uses > -1 && invitation.uses >= invitation.maxUses) {
      return res.status(403).json({
        message: `This activation code has reached its maximum uses.`
      });
    }

    // Check body for missing fields and character length
    if (
      // !firstName ||
      // !lastName ||
      !displayName ||
      !email ||
      !username ||
      !password ||
      !activationCode
    ) {
      return res.status(400).json({
        message: 'Missing one or more required fields.'
      });
    }

    if (displayName.length > 32) {
      return res.status(400).json({
        message: 'Display name must be less than 32 characters.'
      });
    }

    // if (firstName.length > 32) {
    //   return res.status(400).json({
    //     message: "First name must be less than 32 characters.",
    //   });
    // }

    // if (lastName.length > 32) {
    //   return res.status(400).json({
    //     message: "Last name must be less than 32 characters.",
    //   });
    // }

    if (username.length > 32) {
      return res.status(400).json({
        message: 'Username must be less than 32 characters.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters.'
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: 'Username must only contain letters, numbers, and underscores.'
      });
    }

    // Check if username is taken
    await users
      .findOne({
        username
      })
      .then((user) => {
        if (user) {
          return res.status(400).json({
            message: 'Username is already taken.'
          });
        }
      });

    let firebaseError;
    await app();
    const firebaseUser = await admin
      .auth()
      .createUser({
        email,
        password,
        emailVerified: false
      })
      .then((userRecord) => {
        return userRecord;
      })
      .catch((error) => {
        return error;
      });

    if (firebaseUser.code) {
      firebaseError = firebaseUser;
      switch (firebaseError.code) {
        case 'auth/email-already-exists':
          return res.status(400).json({
            message: 'An account with this email address already exists.'
          });
        case 'auth/invalid-email':
          return res.status(400).json({
            message: 'Invalid email address.'
          });
        case 'auth/operation-not-allowed':
          return res.status(400).json({
            message: 'Email/password accounts are not enabled.'
          });
        case 'auth/weak-password':
          return res.status(400).json({
            message: 'Password is too weak.'
          });
        default:
          return res.status(500).json({
            message: 'An unknown error has occurred while creating your account.'
          });
      }
    }

    await users
      .insertOne({
        displayName: displayName,
        username: username.toLowerCase(),
        id: firebaseUser.uid,
        avatar: `${process.env.NEXT_PUBLIC_ROOT_URL}/images/default-avatar.png`,
        bio: null,
        email: {
          address: email.trim().toLowerCase(),
          privacyLevel: 2,
          verified: false
        },
        notifications: {
          email: {
            enabled: true,
            frequency: 'daily'
          }
        },
        alerts: [
          {
            title: 'Email address not verified',
            description: `Your email address has not been verified. Please check your email for a verification link.`,
            type: 'warning',
            action: {
              title: 'Verify email',
              url: `${process.env.NEXT_PUBLIC_ROOT_URL}/home`
            }
          }
        ],
        platform: {
          staff: false,
          staffTitle: null,
          membership: 0,
          invites: invitation.startingReferrals || 0
        },
        payment: {
          customerId: null
        },
        roblox: {
          id: null,
          username: null,
          verified: false,
          verifiedAt: null
        },
        discord: {
          id: null,
          username: null,
          verified: false,
          verifiedAt: null
        },
        statistics: {
          referrals: 0,
          scans: 0
        },
        achievements: {},

        sponsorId: invitation.isSponsor ? invitation.createdBy : null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as User)
      .then(async (result) => {
        // max uses
        if (invitation.maxUses > -1 && invitation.uses + 1 >= invitation.maxUses) {
          await invitations.deleteOne({
            code: activationCode[0]
          });
        } else {
          await invitations.updateOne({ code: activationCode[0] }, { $inc: { uses: 1 } });
        }
        // sponsors
        if (invitation.isSponsor) {
          await users.updateOne({ id: invitation.createdBy }, { $inc: { 'platform.invites': -1 } });
        }
      })
      .catch((error) => {
        console.log(error);
        throw error;
      });

    try {
      const email_link = await admin
        .auth()
        .generateEmailVerificationLink(email.trim().toLowerCase(), {
          url: `${process.env.NEXT_PUBLIC_ROOT_URL}/home`,
          handleCodeInApp: true
        })
        .then((link) => {
          return link;
        })
        .catch((error) => {
          console.log(error);
          throw error;
        });

      // console.log(email_link);

      const msg = {
        to: email.trim().toLowerCase(),
        from: 'xcs-noreply@restrafes.co',
        subject: 'Verify your email address',
        template_id: 'd-9dd7e88dbb554984867e7da76c9d6c6f',
        dynamic_template_data: {
          name: displayName,
          link: email_link
        }
      };
      await sgMail.send(msg).then(() => {
        console.log('Email sent');
      });
    } catch (error) {
      console.log(error);
    }

    return res.status(200).json({
      message: 'Successfully registered! You may now login.',
      success: true
    });
  }

  return res.status(500).json({ message: 'An unknown error has occurred.' });
}
