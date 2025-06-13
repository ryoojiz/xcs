import { admin, app } from '@/pages/api/firebase';
import { Invitation, User } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyGumroadLicense } from '@/lib/gumroad';

import clientPromise from '@/lib/mongodb';
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const invitations = db.collection('invitations');
  let { activationCode } = req.query as { activationCode: string };
  activationCode = decodeURIComponent(activationCode);

  console.log('Activation attempt with code:', activationCode);

  // First, try to find an invitation code
  const invitation = (await invitations.findOne({
    type: 'xcs',
    code: activationCode
  })) as Invitation | null;

  let isGumroadLicense = false;
  let gumroadVerification = null;

  // If no invitation found, check if it's a Gumroad license key
  if (!invitation) {
    console.log('No invitation found, checking if it\'s a Gumroad license key');
    gumroadVerification = await verifyGumroadLicense(activationCode);
    isGumroadLicense = gumroadVerification.isValid;
    
    if (!isGumroadLicense) {
      console.log('Neither valid invitation nor valid Gumroad license');
      return res.status(404).json({
        valid: false,
        message: 'Invalid activation code or license key. Please check the code and try again.'
      });
    }
    
    console.log('Valid Gumroad license found');
  } else {
    console.log('Valid invitation found:', invitation.code);
  }

  if (req.method === 'GET') {
    // For invitation codes, check max uses
    if (invitation && invitation?.maxUses > -1 && invitation?.uses >= invitation?.maxUses) {
      return res.status(403).json({
        valid: false,
        message: `This activation code has reached its maximum uses.`
      });
    }

    // For Gumroad licenses, check if active
    if (isGumroadLicense && gumroadVerification && !gumroadVerification.isActive) {
      return res.status(403).json({
        valid: false,
        message: 'This Gumroad license is not active. Please check your subscription status.'
      });
    }

    return res.status(200).json({
      valid: true,
      message: isGumroadLicense ? 'Valid Gumroad license key.' : 'Valid activation code.'
    });
  }  if (req.method === 'POST') {
    let { activationCode } = req.query as { activationCode: string };
    activationCode = decodeURIComponent(activationCode);

    let { displayName, email, username, password } = req.body as {
      displayName: string;
      email: string;
      username: string;
      password: string;
    };

    console.log('Registration attempt with:', { displayName, email, username, activationCode });

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB as string);
    const users = db.collection('users');
    const invitations = db.collection('invitations');

    // Re-validate the activation code/license for POST request
    const postInvitation = (await invitations.findOne({
      type: 'xcs',
      code: activationCode
    })) as Invitation | null;

    let postIsGumroadLicense = false;
    let postGumroadVerification = null;

    // If no invitation found, check if it's a Gumroad license key
    if (!postInvitation) {
      console.log('No invitation found in POST, checking if it\'s a Gumroad license key');
      postGumroadVerification = await verifyGumroadLicense(activationCode);
      postIsGumroadLicense = postGumroadVerification.isValid;
      
      if (!postIsGumroadLicense) {
        console.log('Neither valid invitation nor valid Gumroad license in POST');
        return res.status(404).json({
          message: 'Invalid activation code or license key. Please check the code and try again.'
        });
      }
      
      console.log('Valid Gumroad license found in POST');
    } else {
      console.log('Valid invitation found in POST:', postInvitation.code);
    }

    // Check invitation-specific limitations
    if (postInvitation && postInvitation.maxUses > -1 && postInvitation.uses >= postInvitation.maxUses) {
      return res.status(403).json({
        message: `This activation code has reached its maximum uses.`
      });
    }

    // For Gumroad licenses, ensure it's still active
    if (postIsGumroadLicense && postGumroadVerification && !postGumroadVerification.isActive) {
      return res.status(403).json({
        message: 'This Gumroad license is not active. Please check your subscription status.'
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
        ],        platform: {
          staff: false,
          staffTitle: null,
          membership: 0,
          invites: postInvitation?.startingReferrals || 0
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
        achievements: {},        license_key: postIsGumroadLicense ? activationCode : '',
        gumroad_status: postIsGumroadLicense ? 'active' as const : 'unknown' as const,
        sponsorId: postInvitation?.isSponsor ? postInvitation.createdBy : null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as User)      .then(async (result) => {
        // Only handle invitation-specific logic if this was an invitation code
        if (postInvitation) {
          // max uses
          if (postInvitation.maxUses > -1 && postInvitation.uses + 1 >= postInvitation.maxUses) {
            await invitations.deleteOne({
              code: activationCode
            });
          } else {
            await invitations.updateOne({ code: activationCode }, { $inc: { uses: 1 } });
          }
          // sponsors
          if (postInvitation.isSponsor) {
            await users.updateOne({ id: postInvitation.createdBy }, { $inc: { 'platform.invites': -1 } });
          }
        }
        console.log('User created successfully:', firebaseUser.uid);
        
        if (postIsGumroadLicense) {
          console.log('User registered with Gumroad license:', activationCode);
        } else {
          console.log('User registered with invitation code:', activationCode);
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
    }    return res.status(200).json({
      message: postIsGumroadLicense 
        ? 'Successfully registered with Gumroad license! You may now login.' 
        : 'Successfully registered with invitation code! You may now login.',
      success: true,
      registrationType: postIsGumroadLicense ? 'gumroad' : 'invitation'
    });
  }

  return res.status(500).json({ message: 'An unknown error has occurred.' });
}
