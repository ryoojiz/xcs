import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const users = db.collection('users');
  const user = await users.findOne({ id: uid });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // compatibility
  if (!user.discord) {
    await users.updateOne(
      { id: uid },
      {
        $set: {
          discord: {
            verified: false,
            id: null,
            username: null
          }
        }
      }
    );
  }

  const timestamp = new Date();

  if (req.method === 'POST') {
    const { code } = req.body;

    // generate token using code
    // see: https://discord.com/developers/docs/topics/oauth2
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID as string,
        client_secret: process.env.DISCORD_CLIENT_SECRET as string,
        grant_type: 'authorization_code',
        scope: 'identify',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_ROOT_URL}/verify/oauth2/discord`
      }).toString()
    }).then((res) => res.json());

    if (tokenResponse.error) {
      console.log(tokenResponse);
      return res.status(400).json({ message: tokenResponse.error_description });
    }

    // get user info using token
    const userResponse = await fetch('https://discord.com/api/oauth2/@me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`
      }
    }).then((res) => res.json());

    if (userResponse.error) {
      console.log(userResponse);
      return res.status(400).json({ message: userResponse.error_description });
    }

    // unlink accounts using discord id
    await users.updateMany(
      { 'discord.id': userResponse.user.id },
      {
        $set: {
          lastUpdatedAt: timestamp,
          discord: {
            verified: false,
            id: null,
            username: null,
            discriminator: null
          }
        }
      }
    );

    // update user using discord info
    await users.updateOne(
      { id: uid },
      {
        $set: {
          lastUpdatedAt: timestamp,
          discord: {
            verified: true,
            verifiedAt: timestamp,
            id: userResponse.user.id,
            username: userResponse.user.username,
            discriminator: userResponse.user.discriminator !== '0' ? userResponse.user.discriminator : null
          }
        }
      }
    );

    // attempt to update user's role in discord
    const roleId = '1127011693868896346';
    const guildId = '1127003608366460978';

    try {
      const ret = await fetch(
        `https://discord.com/api/guilds/${guildId}/members/${userResponse.user.id}/roles/${roleId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'X-Audit-Log-Reason': 'XCS role granted via account linking on the website'
          }
        }
      ).then((ret) => ret);
    } catch {}

    return res.status(200).json({
      success: true,
      message: "You've successfully linked your Discord account."
    });
  }

  if (req.method === 'DELETE') {
    if (!user.discord.verified) {
      return res.status(400).json({
        message: 'You are not linked.'
      });
    }

    await users.updateOne(
      { id: uid },
      {
        $set: {
          lastUpdatedAt: timestamp,
          discord: {
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
            data: 'discord'
          }
        }
      }
    );

    return res.status(200).json({
      message: "You've successfully unlinked your Discord account.",
      success: true
    });
  }

  return res.status(500).json({ message: 'Something went really wrong.' });
}
