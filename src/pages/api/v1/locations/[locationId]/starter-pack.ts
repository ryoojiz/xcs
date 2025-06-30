import { tokenToID } from '@/pages/api/firebase';
import fs from 'fs';
import { generateApiKey } from 'generate-api-key';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Location ID
  const { locationId } = req.query as { locationId: string };

  // Authorization Header
  const authHeader = req.headers.authorization;

  // Bearer Token
  const token = authHeader?.split(' ')[1];

  // Verify Token
  const uid = await tokenToID(token as string);
  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const locations = db.collection('locations');
  const organizations = db.collection('organizations');

  let location = (await locations.findOne({ id: locationId })) as any;
  if (!location) {
    return res.status(404).json({ message: 'Location not found' });
  }

  let organization = await organizations.findOne({
    id: location.organizationId
  });

  if (!organization) {
    return res.status(404).json({ message: 'Organization not found' });
  }

  if (!organization.members[uid as any]) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    // Prepare file
    const filePath = path.join(process.cwd(), 'wyre-starter.rbxmx');
    let buffer = fs.readFileSync(filePath);

    // Check if API Key already exists for this location that hasn't been used yet
    let apiKey = Object.keys(organization.apiKeys).find(
      (key) => organization?.apiKeys[key].locationId === locationId && organization.apiKeys[key].lastUsedAt === null
    );

    // If not, generate a new one
    if (!apiKey) {
      apiKey = generateApiKey({
        method: 'uuidv4',
        dashes: false
      }) as string;
    }

    console.log(apiKey);

    // Modify file content before sending
    buffer = Buffer.from(
      buffer
        .toString()
        .replace('{{locationId}}', location.id)
        .replace('{{locationName}}', location.name)
        .replace('{{configUrl}}', `${process.env.NEXT_PUBLIC_ROOT_URL}/locations/${location.id}`)
        .replace('{{apiKey}}', apiKey)
    );

    const timestamp = new Date();

    // Add API Key to database
    await organizations.updateOne(
      { id: organization.id },
      {
        $set: {
          [`apiKeys.${apiKey}`]: {
            author: uid,
            locationId: locationId,
            createdAt: timestamp,
            lastUsedAt: null
          }
        }
      }
    );

    // Log
    await organizations.updateOne(
      { id: organization.id },
      {
        $push: {
          logs: {
            type: 'api-key-generated',
            performer: uid,
            timestamp: timestamp,
            locationId: locationId
          }
        }
      }
    );

    // Send file
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': buffer.length
    });
    res.write(buffer);
    return res.status(200).end();
  }

  return res.status(500).json({ message: 'An unknown error has occurred.' });
}
