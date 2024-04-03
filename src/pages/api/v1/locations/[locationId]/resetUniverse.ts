import { authToken } from '@/lib/auth';
import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { locationId } = req.query as { locationId: string };
  const { memberId } = req.body as { memberId: string };

  if (req.method !== "PATCH")
    return res.status(405).json({ message: 'Method not allowed.' });

  // check auth
  const uid = await authToken(req);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const users = db.collection('users');
  const locations = db.collection('locations');
  const organizations = db.collection('organizations');

  // check staff privileges
  const user = await users.findOne({ id: uid }, { projection: { id: 1, platform: 1 } });
  console.log(user);
  if (!user?.platform?.staff)
    return res.status(401).json({ message: 'Unauthorized.' });

  // if member ID (customer) is passed, check if they have edit privileges for the location
  const location = await locations.findOne({ id: locationId }, { projection: { organizationId: 1 } });
  if (!memberId) {
    return res.status(400).json({ message: 'For security reasons, a member ID needs to be provided to verify that the customer has edit permissions for the location.' });
  }
  const organization = await organizations.findOne({ id: location?.organizationId }, { projection: { members: 1 } });
  if (!Object.keys(organization?.members)?.includes(memberId) || organization?.members[memberId].role < 3)
    return res.status(401).json({ message: 'The customer that you\'ve provided does not have edit permissions for the location provided.' });

  // reset universe
  await locations.updateOne({ id: locationId }, { $set: { "roblox": { universe: { id: null }, place: undefined } } });

  res.status(200).json({ message: 'Successfully reset universe ID.' });
}