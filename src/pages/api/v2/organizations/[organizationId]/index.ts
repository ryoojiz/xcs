import clientPromise from '@/lib/mongodb';
import { Organization } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // get API key from request header
  // const apiKey = req.headers['Authorization'];
  // if (!apiKey) return res.status(401).json({ message: 'Unauthorized.' });

  // get organization ID from request query
  const { organizationId } = req.query;

  // get organization
  const mongoClient = await clientPromise;
  const db = await mongoClient.db(process.env.MONGODB_DB as string);
  const organization = (await db.collection('organizations').findOne({ id: organizationId })) as Organization | null;

  if (!organization) return res.status(404).json({ success: false, message: 'Not found.' });

  return res.status(200).json({
    success: true,
    organization
  });
}
