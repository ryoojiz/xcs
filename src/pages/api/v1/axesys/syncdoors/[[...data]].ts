import { AccessPoint, Location, Organization, OrganizationMember, User } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';

// @ts-ignore
const mergicianOptions = { appendArrays: true, dedupArrays: true };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // reject non-GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // query parameters
  // /api/v1/axesys/syncdoorspremium/{apiKey}/{locationId}
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ error: 'Missing data.' });
  }

  console.log(`[AXESYS] /api/v1/axesys/syncdoorspremium/: ${data}`);

  let apiKey = data[0];
  let locationId = data[1];

  // create a connection to the database
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const locations = db.collection('locations');
  const organizations = db.collection('organizations');
  const accessPoints = db.collection('accessPoints');

  // fetch location data
  let location = (await locations.findOne(
    {
      id: locationId
    },
    { projection: { id: 1, organizationId: 1 } }
  )) as Location | null;

  if (!location) {
    return res.status(404).json({ error: 'Location not found.' });
  }

  // check if the API key is valid
  let organization = (await organizations.findOne(
    { id: location.organizationId, [`apiKeys.${apiKey}`]: { $exists: true } },
    { projection: { id: 1, members: 1 } }
  )) as unknown as Organization;
  if (!organization) {
    return res.status(401).json({ error: 'Invalid API key.' });
  }

  // create legacy response

  // get all access points
  let accessPointsData = await accessPoints.find({ locationId: location.id }).toArray();

  // global legacy response data
  let legacyResponse = {} as any;

  interface GroupData {
    groupId: number;
    roles: {
      id: number;
      name: string;
      rank: number;
      memberCount: number;
    }[];
    errors?: string[];
  }
  let cachedGroups = {} as Record<string, GroupData>;
  for (const accessPoint of accessPointsData as unknown as AccessPoint[]) {
    console.log(`[AXESYS] Fetching access point ${accessPoint.id}...`);
    legacyResponse[accessPoint.id] = {
      DoorSettings: {
        DoorName: accessPoint.name,
        Active: accessPoint.config.active ? '1' : '0',
        Locked: accessPoint.config.armed ? '1' : '0',
        Timer: accessPoint.config.unlockTime || 8
      },
      AuthorizedUsers: {} as Record<string, string>,
      AuthorizedGroups: [] as Record<string, string>[]
    };

    // get all allowed members from access groups
    await Promise.all(
      Object.values(organization.members).map(async (member: OrganizationMember) => {
        var intersections = await member.accessGroups.filter(
          (e) => accessPoint.config.alwaysAllowed.groups.indexOf(e) !== -1
        );
        // member is allowed if intersections is not empty
        if (intersections.length > 0) {
          // if member-type is roblox
          if (member.type === 'roblox') {
            legacyResponse[accessPoint.id].AuthorizedUsers[member.id] = member.id;
          } else if (member.type === 'roblox-group') {
            const groupId = member.id;

            if (!cachedGroups[groupId]) {
              const data = (await fetch(
                `${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/groups/v1/groups/${groupId}/roles`
              ).then((res) => res.json())) as GroupData;
              if (!data.errors) {
                cachedGroups[groupId] = data;
              }
            }

            const memberRoles = member.groupRoles || [];
            const roleData = cachedGroups[groupId];
            for (const roleId of memberRoles as number[]) {
              // get rank id from role id
              const role = roleData.roles.find((role: any) => role.id === parseInt(roleId.toString()));
              if (role) {
                await legacyResponse[accessPoint.id].AuthorizedGroups.push({
                  [groupId.toString()]: `1-${role.id.toString()}`
                });
              }
            }
          } else {
            // get user
            const user = (await db
              .collection('users')
              .findOne({ id: member.id }, { projection: { id: 1, roblox: 1 } })) as unknown as User;
            if (user && user.roblox.verified && user.roblox.id) {
              console.log(`[AXESYS] Adding user ${user.roblox.id}...`);
              legacyResponse[accessPoint.id].AuthorizedUsers[user.roblox.id] = user.roblox.id;
            }
          }
        }
      })
    );
  }

  return res.status(200).json({
    response: 'ok',
    data: legacyResponse
  });
}
