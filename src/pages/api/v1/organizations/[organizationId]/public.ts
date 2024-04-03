import { NextApiRequest, NextApiResponse } from 'next';

import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { getRobloxGroups, getRobloxUsers } from '@/lib/utils';
import { Organization, OrganizationMember, User } from '@/types';

export const config = {
  api: {
    responseLimit: '16mb',
    bodyParser: {
      sizeLimit: '16mb'
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Organization ID
  const { organizationId } = req.query as { organizationId: string };

  const uid = await authToken(req);
  // if (!uid) {
  //   return res.status(401).json({ message: 'Unauthorized.' });
  // }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const organizations = db.collection('organizations');
  const locations = db.collection('locations');
  const users = db.collection('users');
  let canEdit = false;

  let organization = (await organizations.findOne(
    { id: organizationId },
    {
      projection: {
        id: 1,
        name: 1,
        description: 1,
        avatar: 1,
        ownerId: 1,
        members: 1,
        createdAt: 1,
        updatedAt: 1,
        verified: 1,
        isPersonal: 1
      }
    }
  )) as unknown as Organization;

  if (!organization) {
    return res.status(404).json({ message: 'Organization not found' });
  }

  if (uid && organization.members[uid] && organization.members[uid].role > 0) {
    canEdit = true;
  }

  if (req.method === 'GET') {
    organization.self = uid ? organization.members[uid] : undefined;

    let ownerMember = Object.values(organization.members).find(
      (member: any) => member.id === organization.ownerId
    ) as OrganizationMember;

    // update organization to have owner member
    if (!organization.ownerId) {
      // find owner
      const ownerMemberId = Object.keys(organization.members).find(
        (key: any) => organization.members[key].role === 3
      ) as string;
      ownerMember = organization.members[ownerMemberId] as OrganizationMember;
      await organizations.updateOne({ id: organizationId }, { $set: { ownerId: ownerMemberId } });
      organization.ownerId = ownerMemberId;
    }

    let ownerUser = await users.findOne(
      { id: organization.ownerId },
      {
        projection: {
          id: 1,
          displayName: 1,
          username: 1,
          avatar: 1
        }
      }
    );

    organization.owner = ownerUser as unknown as User;

    // get all members
    let members: Record<string, OrganizationMember> = {};

    // xcs users
    for (const [key, value] of Object.entries(organization.members) as any) {
      if (!['roblox', 'roblox-group'].includes(value.type)) {
        let member = await users.findOne(
          { id: key },
          {
            projection: {
              name: 1,
              id: 1,
              displayName: 1,
              username: 1,
              avatar: 1
            }
          }
        );
        // console.log(member);
        members[key] = {
          type: 'user',
          id: key,
          formattedId: key,
          displayName: member?.displayName,
          username: member?.username,
          avatar: member?.avatar,
          ...value
        };
        console.log(members[key]);
      }
      if (Object.keys(members).length > 99) break;
    }

    // roblox users

    // make an array of roblox user and group ids
    let robloxUserIds = [];
    let robloxGroupIds = [];

    for (const [key, value] of Object.entries(organization.members) as any) {
      if (value.type === 'roblox') {
        robloxUserIds.push(value.id);
      } else if (value.type === 'roblox-group') {
        robloxGroupIds.push(value.id);
      }
    }

    // get roblox users
    let robloxUsers = await getRobloxUsers(robloxUserIds);
    let robloxGroups = await getRobloxGroups(robloxGroupIds);

    // add roblox users to members array
    for (const [key, value] of Object.entries(organization.members) as any) {
      if (value.type === 'roblox') {
        members[key] = {
          id: key,
          displayName: robloxUsers[value.id].displayName,
          username: robloxUsers[value.id].name,
          avatar: robloxUsers[value.id].avatar,
          ...value
        };
      } else if (value.type === 'roblox-group') {
        members[key] = {
          id: key,
          displayName: robloxGroups[value.id].name,
          username: robloxGroups[value.id].name,
          avatar: robloxGroups[value.id].avatar,
          roleset: robloxGroups[value.id].roles,
          ...value
        };
      }
      if (Object.keys(members).length > 99) break;
    }

    // members = members.sort((a: any, b: any) =>
    //   a.role > b.role || b.type === 'roblox-group' || b.type === 'card' ? -1 : 1
    // ); // sort by role (descending)

    // sort object by role (descending)
    members = Object.fromEntries(Object.entries(members).sort(([, a], [, b]) => a.role - b.role));

    // Get Access Points
    for (const accessGroupId in organization.accessGroups) {
      const accessGroup = organization.accessGroups[accessGroupId];
      if (accessGroup.locationId) {
        const location = await locations.findOne({ id: accessGroup.locationId }, { projection: { name: 1, id: 1 } });
        if (location) organization.accessGroups[accessGroupId].locationName = location.name;
      }
    }

    organization.canEdit = canEdit;

    const countLocations = await db.collection('locations').countDocuments({ organizationId: organizationId });
    const countAccessGroups = await db.collection('accessGroups').countDocuments({ organizationId: organizationId });

    organization.statistics = organization.statistics || {};
    organization.statistics.numLocations = countLocations;
    organization.statistics.numAccessGroups = countAccessGroups;
    organization.statistics.numMembers = Object.keys(organization.members).length;

    return res.status(200).json({
      organization: { ...organization, members }
    });
  }

  return res.status(500).json({
    message: 'An unknown errror occurred. If this error persists, please contact customer support.'
  });
}
