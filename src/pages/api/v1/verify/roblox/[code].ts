import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';

async function checkBlacklist(robloxId: string) {
  // temp
  // type 0 = user, type 1 = group
  const blacklist = [
    // {
    //   type: 0,
    //   id: 32757211,
    // },
    {
      type: 1,
      id: 4951045
    }
  ] as { type: number; id: number }[];

  // check if user is in any of the blacklisted users
  const user = blacklist.find((user) => user.type === 0 && user.id === Number(robloxId));
  if (user) return true;

  const groups = await fetch(
    `${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/groups/v2/users/${robloxId}/groups/roles`
  )
    .then((res) => res.json())
    .then((json) => json?.data);

  // check if user is in any of the blacklisted groups
  const group = blacklist.find((group) => group.type === 1 && groups?.find((g: any) => g.group.id === group.id));
  if (group) return true;

  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // roblox-side
  console.log(req.method);
  if (req.method === 'POST') {
    const { code } = req.query; // verification code from website
    const { robloxId } = req.body; // roblox id from roblox

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB as string);
    const organizations = db.collection('organizations');
    const codes = db.collection('verificationCodes');
    const users = db.collection('users');

    const fetchCode = await codes.findOne({ code: code });

    if (fetchCode) {
      // fetch user's roblox username
      const username = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/users/v1/users/${robloxId}`)
        .then((res) => res.json())
        .then((json) => json?.name);

      if (!username) {
        return res.status(404).json({
          success: false,
          message: 'Roblox user not found.'
        });
      }

      // check if user is blacklisted
      const isBlacklisted = await checkBlacklist(robloxId);
      if (isBlacklisted) {
        return res.status(403).json({
          success: false,
          message: 'You are not permitted to use the service.'
        });
      }

      // locate any users that have the same roblox id and revoke their verification
      await users.updateMany(
        { 'roblox.id': robloxId },
        {
          $set: {
            roblox: {
              username: '',
              id: '',
              verified: false
            }
          }
        }
      );

      // update user's verification
      const timestamp = new Date();
      await users.updateOne(
        { id: fetchCode.id },
        {
          $set: {
            roblox: {
              username: username,
              id: robloxId.toString(),
              verified: true,
              verifiedAt: timestamp
            }
          }
        }
      );

      // convert all roblox-type members across all organizations to user-type
      const robloxUserOrganizations = await organizations
        .find({
          [`members.${robloxId}`]: { $exists: true }
        })
        .toArray(); // get all organizations that have the roblox user as a member

      // convert all roblox-type members to user-type
      for (const organization of robloxUserOrganizations) {
        const organizationRobloxUser = organization.members[robloxId];
        await organizations.updateOne(
          { id: organization.id },
          {
            $set: {
              [`members.${fetchCode.id}`]: {
                type: 'user',
                id: fetchCode.id,
                role: organizationRobloxUser.role,
                accessGroups: organizationRobloxUser.accessGroups,
                scanData: organizationRobloxUser.scanData,
                joinedAt: organizationRobloxUser.joinedAt
              }
            },
            $unset: {
              [`members.${robloxId}`]: ''
            }
          }
        );
      }

      // revoke code
      await codes.deleteOne({ code: code });
      return res.status(200).json({ success: true, message: 'Successfully verified.' });
    } else {
      return res.status(404).json({ success: false, message: 'Code not found.' });
    }
  } else if (req.method === 'GET') {
    res.status(200).json({ response: 'ok' });
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
