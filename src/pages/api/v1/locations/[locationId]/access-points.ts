import { tokenToID } from '@/pages/api/firebase';
import { NextApiRequest, NextApiResponse } from 'next';
import { generate as generateString } from 'randomstring';

import clientPromise from '@/lib/mongodb';
import { AccessPoint } from '@/types';

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
  const organizations = db.collection('organizations');
  const locations = db.collection('locations');
  const accessPoints = db.collection('accessPoints');

  let location = (await locations.findOne({ id: locationId })) as any;
  if (!location) {
    return res.status(404).json({ message: 'Location not found' });
  }

  let accessPointsData = (await accessPoints.find({ locationId: locationId }).toArray()) as any;
  if (!accessPointsData) {
    return res.status(404).json({ message: 'Access Points not found' });
  }

  let organization = await organizations.findOne({
    id: location.organizationId
  });

  if (!organization) {
    return res.status(404).json({ message: 'Organization not found' });
  }

  let member = organization.members[uid as any];
  if (!member) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      accessPoints: accessPointsData,
      self: organization.members[uid as any]
    });
  }

  if (req.method === 'POST') {
    if (member.role <= 1) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    // Create Access Point
    const timestamp = new Date();
    // const id = uuidv4();
    let id = '';
    do {
      id = generateString({
        length: 8,
        charset: 'alphanumeric',
        capitalization: 'uppercase'
      });
    } while (await accessPoints.findOne({ id: id }));

    let { name, description, templateId } = req.body as {
      name: string;
      description: string;
      templateId: AccessPoint;
    };

    // Character limits
    if (name !== undefined) {
      name = name.trim();
      if (name.length > 32 || name.length < 1) {
        return res.status(400).json({ message: 'Name must be between 1-32 characters.' });
      }
    }

    if (description !== undefined) {
      description = description.trim();
      if (description.length >= 256) {
        return res.status(400).json({
          message: 'Description must be less than or equal to 256 characters.'
        });
      }
    }

    const template = templateId ? await db.collection('accessPoints').findOne({ id: templateId }) : null;

    const accessPoint = {
      id: id,
      name: name,
      description: description,

      organizationId: location.organizationId,
      locationId: locationId,

      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: uid,

      config:
        template?.config ||
        ({
          active: true,
          armed: true,
          unlockTime: 8,

          schedules: [],
          temporaryAccess: [],

          alwaysAllowed: {
            groups: [],
            members: []
          },

          webhook: {
            enabled: true,
            url: '',
            eventDenied: false,
            eventGranted: false
          },

          scanData: {
            disarmed: {},
            ready: {}
          },

          colors: {
            idle: '#ff0000',
            scanning: '#00ff00',

            granted: '#0000ff',
            denied: '#ffff00'
          }
        } as unknown as AccessPoint)

      // configuration: {
      //   active: true,
      //   armed: true,
      //   timedAccess: {
      //     routines: [],
      //     temporaryAccess: [],
      //   },
      //   alwaysAllowed: {
      //     clearances: [],
      //     users: [],
      //   },
      // },
    };

    await accessPoints.insertOne(accessPoint);

    return res.status(200).json({
      message: 'Access point created successfully!',
      accessPointId: id
    });
  }

  return res.status(500).json({ message: 'An unknown error has occurred.' });
}
