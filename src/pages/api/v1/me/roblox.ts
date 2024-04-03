import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { AccessPoint, Organization } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const users = db.collection('users');
  const organizations = db.collection('organizations');
  const accessPoints = db.collection('accessPoints');
  const user = await users.findOne({ id: uid });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const timestamp = new Date();

  if (req.method === 'POST') {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Missing code.' });
    }

    // fetch access token from code
    const accessTokenResponse = await fetch(`https://apis.roblox.com/oauth/v1/token`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID + ':' + process.env.ROBLOX_CLIENT_SECRET).toString(
            'base64'
          )
      },
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code
      })
    });

    const accessToken = await accessTokenResponse.json();
    if (!accessToken.access_token) {
      return res.status(400).json({ message: 'Invalid code.' });
    }

    // fetch user info from access token
    const userInfoResponse = await fetch(`https://apis.roblox.com/oauth/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`
      }
    });
    const userInfo = await userInfoResponse.json();
    if (!userInfo.sub) {
      return res.status(400).json({ message: 'Could not fetch user info from authorization.' });
    }

    // unverify other accounts with the same roblox id
    const otherUsers = await users.find({ 'roblox.id': userInfo.sub }).toArray();
    for (const otherUser of otherUsers) {
      if (otherUser.id === uid) continue; // skip logged in user
      await users.updateOne(
        { id: otherUser.id },
        {
          $set: {
            lastUpdatedAt: new Date(),
            roblox: {
              verified: false,
              verifiedAt: null,
              id: null,
              username: null
            }
          }
        }
      );
    }

    // convert all roblox-type members across all organizations to user-type
    const robloxUserOrganizations = await organizations
      .find({
        [`members.${userInfo.sub}`]: { $exists: true }
      })
      .toArray(); // get all organizations that have the roblox user as a member

    // convert all roblox-type members to user-type
    for (const organization of robloxUserOrganizations) {
      const organizationRobloxUser = organization.members[userInfo.sub];
      await organizations.updateOne(
        { id: organization.id },
        {
          $set: {
            [`members.${user.id}`]: {
              // type: 'user',
              // id: user.id,
              // role: organizationRobloxUser.role,
              // accessGroups: organizationRobloxUser.accessGroups,
              // scanData: organizationRobloxUser.scanData,
              // joinedAt: organizationRobloxUser.joinedAt
              ...organizationRobloxUser,
              type: 'user',
              id: user.id,
              formattedId: undefined,
              role: organizationRobloxUser.role,
              updatedAt: timestamp
            }
          },
          $unset: {
            [`members.${userInfo.sub}`]: ''
          }
        }
      );
    }

    // convert all roblox-type members across all access points to user-type
    console.log(robloxUserOrganizations.map((organization) => organization.id));
    const robloxUserAccessPoints = (await accessPoints
      .find(
        {
          organizationId: { $in: robloxUserOrganizations.map((organization) => organization.id) },
          'config.alwaysAllowed.members': { $in: [userInfo.sub] }
        },
        { projection: { id: 1 } }
      )
      .toArray()) as any as AccessPoint[];

    // mongodb doesn't support multiple operations on the same field, so we have to do this in two steps

    for (const accessPoint of robloxUserAccessPoints) {
      console.log(accessPoint);
      await accessPoints.updateOne(
        {
          id: accessPoint.id
        },
        {
          $pull: {
            [`config.alwaysAllowed.members`]: userInfo.sub
          } as any
        }
      );

      await accessPoints.updateOne(
        {
          id: accessPoint.id
        },
        {
          $push: {
            [`config.alwaysAllowed.members`]: user.id
          } as any
        }
      );
    }

    // verify user
    await users
      .updateOne(
        { id: uid },
        {
          $set: {
            lastUpdatedAt: timestamp,
            roblox: {
              verified: true,
              verifiedAt: timestamp,
              id: userInfo.sub,
              username: userInfo.name
            }
          }
        }
      )
      .then(() => {
        return res.status(200).json({
          message: "You've successfully verified your Roblox account.",
          success: true
        });
      })
      .catch((err) => {
        return res.status(500).json({ message: 'Something went really wrong.' });
      });
    return;
  } else if (req.method === 'DELETE') {
    if (!user.roblox.verified) {
      return res.status(400).json({
        message: 'You are not verified.'
      });
    }

    const timestamp = new Date();
    await users.updateOne(
      { id: uid },
      {
        $set: {
          lastUpdatedAt: timestamp,
          roblox: {
            verified: false,
            id: null,
            username: null
          }
        }
      }
    );
    await users.updateOne(
      { id: uid },
      {
        $push: {
          logs: {
            type: 'account_unlink',
            performer: uid,
            timestamp: timestamp,
            data: 'roblox'
          }
        }
      }
    );

    return res.status(200).json({
      message: "You've successfully unverified your Roblox account.",
      success: true
    });
  }

  return res.status(500).json({ message: 'Something went really wrong.' });
}
