import { tokenToID } from '@/pages/api/firebase';
import { NextApiRequest, NextApiResponse } from 'next';
import { generate as generateString } from 'randomstring';

import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    let { name, description, organizationId } = req.body as {
      name: string;
      description: string;
      organizationId: string;
    };

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
    const users = db.collection('users');

    const user = await users.findOne({
      id: uid
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.roblox.verified) {
      return res.status(403).json({
        message: 'You must link your Roblox account before creating a location.'
      });
    }

    let organization = await organizations.findOne({
      id: organizationId
    });

    if (!organization) {
      return res.status(404).json({ message: `Organization not found (${organizationId})` });
    }

    // Check if user is a member of the organization and has permission to create a location
    if (!organization.members[uid]) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (organization.members[uid].role < 2) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Check if organization has less than 3 locations
    const ownedLocations = await locations
      .find({
        organizationId: organizationId
      })
      .toArray();

    const organizationOwner = await users.findOne({
      id: organization.ownerId
    });

    if (
      ownedLocations.length >= 4 &&
      !organizationOwner?.platform?.staff &&
      organizationOwner?.platform?.membership < 1
    ) {
      return res.status(403).json({
        message:
          'This organization has reached the maximum amount of locations. ' +
          (organization.members[uid].role === 3
            ? 'Upgrade your account to create more locations.'
            : 'The owner of this organization must upgrade their account to create more locations.')
      });
    }

    // Character limits
    if (name !== undefined) {
      name = name.trim();
      if (name.length > 32 || name.length < 1) {
        return res.status(400).json({ message: 'Location name must be between 1-32 characters.' });
      }
    }

    if (description !== undefined) {
      description = description.trim();
      if (description.length >= 256) {
        return res.status(400).json({
          message: 'Location description must be less than or equal to 256 characters.'
        });
      }
    }

    // Creating a new location
    const timestamp = new Date();
    // const id = uuidv4();
    const id = generateString({
      length: 16,
      charset: 'alphanumeric',
      capitalization: 'lowercase'
    });

    await locations.insertOne({
      id: id,
      name: name,
      description: description || '',
      tags: [],
      organizationId: organizationId,
      avatar: null,
      roblox: {
        universe: {
          id: null,
          name: null,
          thumbnail: null
        }
      },
      enabled: true,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    await organizations.updateOne(
      { id: organization.id },
      {
        $push: {
          logs: {
            type: 'location-created',
            performer: uid,
            timestamp: timestamp,
            locationId: id
          }
        }
      }
    );

    return res.status(200).json({
      message: 'Successfully created a location.',
      success: true,
      locationId: id
    });
  }

  return res.status(500).json({ message: 'An unknown error has occurred.' });
}
