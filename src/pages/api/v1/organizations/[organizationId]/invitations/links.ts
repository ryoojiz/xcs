import { NextApiRequest, NextApiResponse } from 'next';
import { generate as generateString } from 'randomstring';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Invitation } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  // Organization ID
  const { organizationId } = req.query as { role: string; organizationId: string };
  const { role, singleUse } = req.body as { role: number; singleUse: boolean };

  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const organizations = db.collection('organizations');
  const invitations = db.collection('invitations');
  let organization = (await organizations.findOne({ id: organizationId })) as any;

  if (!organization) {
    return res.status(404).json({ message: 'Organization not found' });
  }

  if (!organization.members[uid] || organization.members[uid].role < 2) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // Create Invite Code
  if (req.method === 'POST') {
    const timestamp = new Date();

    // keep generating until we get a unique code
    let code;
    do {
      code = generateString({
        length: 8,
        charset: 'alphanumeric'
      });
    } while (await invitations.findOne({ code: code }));

    await invitations.insertOne({
      type: 'organization',
      code: code,

      organizationId: organizationId,
      role: role,
      singleUse: singleUse,

      uses: 0,
      maxUses: singleUse ? 1 : -1,

      createdAt: timestamp.toISOString(),
      createdBy: uid
    } as Invitation);

    await organizations.updateOne(
      { id: organization.id },
      {
        $push: {
          logs: {
            type: 'invite-code-created',
            performer: uid,
            timestamp: timestamp
          }
        }
      }
    );

    return res.status(200).json({ message: 'Successfully created an invitation!', success: true, inviteCode: code });
  }

  return res.status(500).json({ message: 'An unknown errror occurred.' });
}
