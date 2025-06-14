import { tokenToID } from '@/pages/api/firebase';
import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';
import { getRobloxUsers } from '@/lib/utils';
import { OrganizationMember } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Access Point ID
  const { accessPointId } = req.query as { accessPointId: string };

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
  const accessPoints = db.collection('accessPoints');
  const users = db.collection('users');

  let accessPoint = (await accessPoints.findOne({ id: accessPointId })) as any;

  if (!accessPoint) {
    return res.status(404).json({ message: 'Access point not found.' });
  }

  let organization = await organizations.findOne(
    {
      id: accessPoint.organizationId
    },
    {
      projection: {
        id: 1,
        name: 1,
        members: 1,
        accessGroups: 1
      }
    }
  );

  if (!organization) {
    return res.status(404).json({ message: 'Organization not found.' });
  }

  let member = organization.members[uid as string] as OrganizationMember;
  if (!member) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // Fetching Access Point Data
  if (req.method === 'GET') {
    // Get User Permissions
    let out = {
      accessPoint: accessPoint
    };
    out.accessPoint.organization = organization;
    delete out.accessPoint.organization.invitations;
    out.accessPoint.location = await locations.findOne({
      id: accessPoint.locationId
    });

    // add locationName to each access group
    const accessGroups = out.accessPoint.organization.accessGroups;
    const accessGroupIds = Object.keys(accessGroups);
    await accessGroupIds.forEach(async (id) => {
      if (accessGroups[id].locationId === out.accessPoint.location.id) {
        const location = await locations.findOne({ id: accessGroups[id].locationId }, { projection: { name: 1 } });
        out.accessPoint.organization.accessGroups[id].locationName = location?.name;
      }
    });

    const regularMembers = Object.keys(organization.members).filter((member) => {
      if (organization?.members[member].type !== 'roblox') {
        return member;
      }
    });

    const robloxMembers = Object.keys(organization.members).filter((member) => {
      if (organization?.members[member].type === 'roblox') {
        return member;
      }
    });

    await regularMembers.forEach(async (member) => {
      const user = await users
        .findOne({ id: member }, { projection: { id: 1, displayName: 1, username: 1 } })
        .then((res) => res);
      out.accessPoint.organization.members[member] = {
        ...out.accessPoint.organization.members[member],
        displayName: user?.displayName,
        username: user?.username
      };
    });

    // fetch roblox display names and usernames
    const robloxUsers = await getRobloxUsers(robloxMembers);

    await Object.entries(robloxUsers).map(async ([id, data]: any) => {
      out.accessPoint.organization.members[id] = {
        ...out.accessPoint.organization.members[id],
        displayName: data.displayName,
        username: data.name
      };
    });

    // get access points
    for (const accessGroupId in organization.accessGroups) {
      const accessGroup = organization.accessGroups[accessGroupId];
      if (accessGroup.locationId) {
        const location = await locations.findOne({ id: accessGroup.locationId }, { projection: { name: 1, id: 1 } });
        if (location) organization.accessGroups[accessGroupId].locationName = location.name;
      }
    }

    out.accessPoint.self = organization.members[uid as any];
    return res.status(200).json(out);
  }

  // Updating Data
  if (req.method === 'PUT') {
    // check permissions
    if (member.role < 1 && !member.permissions?.accessPoints.edit) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (!req.body) {
      return res.status(400).json({ message: 'No body provided' });
    }

    let body = req.body as any;

    // Character limits
    if (body.name !== undefined) {
      body.name = body.name.trim();
      if (member.role < 2 && body.name !== accessPoint.name) {
        return res.status(401).json({ message: 'Unauthorized.' });
      }
      if (body.name.length > 32 || body.name.length < 1) {
        return res.status(400).json({ message: 'Name must be between 1-32 characters.' });
      }
    }

    if (body.description) {
      body.description = body.description.trim();
      if (member.role <= 1 && body.description !== accessPoint.description) {
        return res.status(401).json({ message: 'Unauthorized.' });
      }
      if (body.description.length > 256) {
        return res.status(400).json({ message: 'Description must be less than 256 characters.' });
      }
    }

    if (body.config?.unlockTime) {
      try {
        body.config.unlockTime = parseInt(body.config.unlockTime);
      } catch {
        return res.status(400).json({ message: 'Invalid unlock time.' });
      }
    }

    if (body.config?.unlockTime === 0) {
      body.config.unlockTime = 8;
    }

    if (body.config?.unlockTime < 0) {
      return res.status(400).json({ message: 'Invalid unlock time.' });
    }

    const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (body.config?.webhook?.url) {
      if (!urlPattern.test(body.config.webhook.url)) {
        return res.status(400).json({ message: 'Invalid webhook URL.' });
      }
    }

    // send webhook a test request if it's a new webhook url
    if (body.config?.webhook?.url && !accessPoint.config?.webhook?.url) {
      const location = await locations.findOne(
        {
          id: accessPoint.locationId
        },
        { projection: { name: 1 } }
      );

      const avatarUrl = `${process.env.NEXT_PUBLIC_ROOT_URL}/images/logo-square.jpeg`;
      const webhook = body.config.webhook;
      const webhookRes = fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'XCS',
          avatar_url: avatarUrl,
          embeds: [
            {
              title: 'Access Point Webhook Configured',
              description: `If you're seeing this, your webhook has been successfully configured! 🎉\nClick [here](${process.env.NEXT_PUBLIC_ROOT_URL}/access-points/${accessPoint?.id}) to reconfigure your access point.`,
              color: 0xffffff,
              thumbnail: {
                url: avatarUrl
              },
              author: {
                name: 'Restrafes XCS',
                url: 'https://wyre.ryj.my.id',
                icon_url: avatarUrl
              },
              fields: [
                {
                  name: 'Access Point',
                  value: accessPoint?.name
                },
                {
                  name: 'Location',
                  value: location?.name
                },
                {
                  name: 'Organization',
                  value: organization?.name
                }
              ]
            }
          ]
        })
      }).then((data) => {
        if (!data.ok || data.status !== 204) {
          return res.status(400).json({
            message: 'Unable to verify webhook. Ensure your URL is correct and try again.'
          });
        }
      });
    }

    try {
      body.config.scanData.disarmed = JSON.parse(body?.config?.scanData?.disarmed || '{}');
      body.config.scanData.ready = JSON.parse(body?.config?.scanData?.ready || '{}');
      body.config.scanData.granted = JSON.parse(body?.config?.scanData?.granted || '{}');
      body.config.scanData.denied = JSON.parse(body?.config?.scanData?.denied || '{}');
    } catch (err) {
      return res.status(400).json({
        message: 'Unable to parse scan data. Check your JSON and try again.'
      });
    }

    const timestamp = new Date();

    body.updatedAt = timestamp;

    await accessPoints.updateOne(
      { id: accessPoint.id },
      {
        $set: {
          name: body.name,
          description: body.description,
          tags: body.tags,
          updatedAt: timestamp,
          updatedById: uid,
          config: body.config
        }
      }
    );
    await locations.updateOne(
      { id: accessPoint.locationId },
      {
        $set: {
          updatedAt: timestamp,
          updatedById: uid
        }
      }
    );
    await organizations.updateOne(
      { id: organization.id },
      {
        $set: {
          updatedAt: timestamp,
          updatedById: uid
        },
        $push: {
          logs: {
            type: 'access-point-updated',
            performer: uid,
            timestamp: timestamp,
            accessPoint: accessPoint.id,
            data: body
          }
        }
      }
    );

    return res.status(200).json({ message: 'Successfully updated access point.', success: true });
  }

  // Deleting Location Data
  if (req.method === 'DELETE') {
    const timestamp = new Date();

    // Delete Access Point
    await accessPoints.deleteOne({ id: accessPointId });

    // Delete Scan Events
    await db.collection('scanEvents').deleteMany({ accessPointId: accessPoint.id });

    // Log Deletion
    await organizations.updateOne(
      { id: organization.id },
      {
        $push: {
          logs: {
            type: 'location_deleted',
            performer: uid,
            timestamp: timestamp,
            accessPointId: accessPoint.id
          }
        }
      }
    );

    return res.status(200).json({ message: 'Successfully deleted access point!', success: true });
  }

  return res.status(500).json({ message: 'An unknown error has occurred.' });
}
