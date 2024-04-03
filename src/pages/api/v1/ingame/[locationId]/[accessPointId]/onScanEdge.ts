// @ts-ignore
import mergician from 'mergician';

// import clientPromise from '@/lib/mongodb';
// @ts-ignore
import { getRobloxUsers } from '@/lib/utils';
import { AccessPoint, Location, Organization, OrganizationMember } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

const mongoRequestHeaders = {
  'Content-Type': 'application/json',
  'User-Agent': 'XCS/1.0',
  apiKey: process.env.MONGODB_DATA_API_KEY as string
};
const mongoBody = {
  dataSource: 'mongodb-atlas',
  database: 'xcs'
};

const findOne = async (collection: string, filter: any, projection: any) => {
  return await fetch(`${process.env.MONGODB_DATA_API_ROOT_URL}/action/findOne`, {
    method: 'POST',
    headers: {
      ...mongoRequestHeaders
    } as any,
    body: JSON.stringify({
      ...mongoBody,
      collection,
      filter,
      projection
    })
  })
    .then((res) => res.json())
    .then((res) => res.document || null);
};

const updateOne = async (collection: string, filter: any, update: any) => {
  return await fetch(`${process.env.MONGODB_DATA_API_ROOT_URL}/action/updateOne`, {
    method: 'POST',
    headers: {
      ...mongoRequestHeaders
    } as any,
    body: JSON.stringify({
      ...mongoBody,
      collection,
      filter,
      update
    })
  })
    .then((res) => res.json())
    .then((res) => res.document || null);
};

// this is where the magic happens
// only execute this edge function in D.C., as the database is located in Ashburn
export const config = {
  runtime: 'edge',
  regions: ['iad1']
};

const mergicianOptions = { appendArrays: true, dedupArrays: true };
const sortByPriority = (organization: Organization, array: string[]) => {
  return array.sort((a, b) => {
    return (organization.accessGroups[a]?.priority || 0) - (organization.accessGroups[b]?.priority || 0);
  });
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'GET') {
    // return res.status(405).json({ message: 'Method not allowed.' });
    return NextResponse.json({ message: 'Method not allowed.' }, { status: 405 });
  }

  // edge runtime doesn't support req.query, so we have to parse the query string ourselves
  const search = req.nextUrl.search;
  const params = Object.fromEntries(new URLSearchParams(search));

  let { locationId, accessPointId, apiKey, userId, cardNumbers, universeId } = params as {
    locationId: string;
    accessPointId: string;
    apiKey: string;
    userId: string;
    cardNumbers: string;
    universeId: string;
  };

  if (locationId === 'UPTIME') return NextResponse.json({ success: true }, { status: 200 });

  const timestamp = new Date();

  // check if API key is empty
  if (!apiKey) {
    // return res.status(401).json({ success: false, message: 'No API key provided.' });
    return NextResponse.json({ success: false, message: 'No API key provided.' }, { status: 401 });
  }

  // get location
  // const location = await dbLocations.findOne({ id: locationId });
  const location = (await findOne(
    'locations',
    { id: locationId },
    { name: 1, id: 1, organizationId: 1 }
  )) as Location | null;
  if (!location) {
    // return res.status(404).json({ success: false, message: 'Location not found.' });
    return NextResponse.json({ success: false, message: 'Location not found.' }, { status: 404 });
  }

  console.log('location', location);

  // get organization
  // const organization = (await dbOrganizations.findOne(
  //   {
  //     id: location.organizationId
  //   },
  //   { projection: { id: 1, name: 1, members: 1, accessGroups: 1 } }
  // )) as unknown as Organization;
  const organization = (await findOne(
    'organizations',
    { id: location.organizationId },
    { id: 1, name: 1, members: 1, accessGroups: 1, apiKeys: 1 }
  )) as Organization | null;
  if (!organization) {
    // return res.status(404).json({ success: false, message: 'Organization not found.' });
    return NextResponse.json({ success: false, message: 'Organization not found.' }, { status: 404 });
  }

  // check API key
  if (!((apiKey as string) in organization.apiKeys)) {
    // return res.status(401).json({ success: false, message: 'Invalid API key.' });
    return NextResponse.json({ success: false, message: 'Invalid API key.' }, { status: 401 });
  }

  // get access point
  // const accessPoint = await dbAccessPoints.findOne({ id: accessPointId }, { projection: { _id: 0 } });
  const accessPoint = (await findOne('accessPoints', { id: accessPointId }, {})) as AccessPoint | null;
  if (!accessPoint) {
    // return res.status(404).json({ success: false, message: 'Access point not found.' });
    return NextResponse.json({ success: false, message: 'Access point not found.' }, { status: 404 });
  }

  // TODO: finish this

  // check if access point is active, if not, deny access
  if (!accessPoint.config.active) {
    // return res.status(200).json({
    //   success: true,
    //   grant_type: 'access_point_inactive',
    //   response_code: 'access_denied',
    //   scan_data: accessPoint.config?.scanData?.denied || {}
    // });
    return NextResponse.json(
      {
        success: true,
        grant_type: 'access_point_inactive',
        response_code: 'access_denied',
        scan_data: accessPoint.config?.scanData?.denied || {}
      },
      { status: 200 }
    );
  }

  // check if access point is armed, if not, grant access
  if (!accessPoint.config.armed) {
    // return res.status(200).json({
    //   success: true,
    //   grant_type: 'access_point_unarmed',
    //   response_code: 'access_granted',
    //   scan_data: accessPoint.config?.scanData?.granted || {}
    // });
    return NextResponse.json(
      {
        success: true,
        grant_type: 'access_point_unarmed',
        response_code: 'access_granted',
        scan_data: accessPoint.config?.scanData?.granted || {}
      },
      { status: 200 }
    );
  }

  const allowedGroups = accessPoint.config.alwaysAllowed.groups;
  const allowedUsers = accessPoint.config.alwaysAllowed.users;
  let allowedCards = accessPoint.config.alwaysAllowed.cards || [];

  // get all access groups that are open to everyone
  const openAccessGroups = sortByPriority(organization, Object.keys(organization.accessGroups)).filter(
    (groupId) =>
      (organization.accessGroups[groupId].type === 'organization' ||
        organization.accessGroups[groupId].locationId === locationId) &&
      organization.accessGroups[groupId]?.config?.active &&
      organization.accessGroups[groupId]?.config?.openToEveryone
  );

  // get all organization members that belong to allowed groups
  let allowedOrganizationMembers = {} as Record<string, string[]>;
  for (const group of allowedGroups) {
    for (const [memberId, member] of Object.entries(organization.members) as any) {
      if (!((memberId as string) in allowedOrganizationMembers) && member.accessGroups.includes(group)) {
        allowedOrganizationMembers[memberId] = member.accessGroups;

        // add open access groups to the user's allowed groups
        allowedOrganizationMembers[memberId] = mergician(mergicianOptions)(allowedOrganizationMembers[memberId], {
          openAccessGroups
        });
      }
    }
  }

  // fetch all roblox ids from allowed users
  let allowedRobloxIds = {} as any;
  for (const memberId of Object.keys(allowedOrganizationMembers)) {
    const member = organization.members[memberId];
    if (member.type === 'roblox') {
      allowedRobloxIds[member.id] = memberId;
    } else {
      // const user = await dbUsers.findOne({ id: memberId }).then((user) => user);
      const user = await findOne('users', { id: memberId }, { id: 1, roblox: 1 });
      if (user && user.roblox?.verified) {
        allowedRobloxIds[user.roblox.id] = memberId;
      }
    }
  }

  let isAllowed = Object.keys(allowedRobloxIds).includes(userId?.toString() as string);

  // check for access through roblox groups
  // get roblox groups and roles from user
  let groupScanData = {} as any;
  let allowedGroupRoles = {} as any; // roblox group roles that are allowed

  // make a list of allowed group roles from allowed groups
  const robloxMemberGroups = Object.values(organization.members as Record<string, OrganizationMember>).filter(
    (member: any) => member.type === 'roblox-group'
  );
  for (const member of robloxMemberGroups as any) {
    for (const accessGroup of sortByPriority(organization, member.accessGroups)) {
      if (allowedGroups.includes(accessGroup)) {
        for (const roleset of member.groupRoles) {
          allowedGroupRoles[roleset] = member;
        }
      }
    }
  }

  if (cardNumbers) {
    const cardMembers = Object.keys(allowedOrganizationMembers).filter(
      (memberId) => organization.members[memberId].type === 'card'
    );
    let allowedCardNumbers = [] as string[];

    // go through each card member and append their card numbers to the allowed cards list
    for (const memberId of cardMembers) {
      allowedCardNumbers = allowedCardNumbers.concat(organization.members[memberId].cardNumbers as any);
    }

    for (const cardNumber of cardNumbers.split(',')) {
      if (allowedCardNumbers.includes(cardNumber as string)) {
        isAllowed = true;
        // find each member that has the card number
        for (const memberId of cardMembers) {
          if ((organization.members[memberId]?.cardNumbers || []).includes(cardNumber as string)) {
            // get scan data from allowed groups' access groups
            for (const group of sortByPriority(organization, organization.members[memberId].accessGroups)) {
              if (organization.accessGroups[group]?.config?.active) {
                groupScanData = mergician(mergicianOptions)(
                  groupScanData,
                  organization.accessGroups[group]?.scanData || {}
                );
                console.log('adding scan data from access group', group);
              }
            }
            // get scan data from the member
            groupScanData = mergician(mergicianOptions)(groupScanData, organization.members[memberId]?.scanData || {});
          }
        }
      }
    }
  }

  let userGroupRoles = [] as any; // roblox group roles that the user has
  const robloxUserGroups = await fetch(
    `${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/groups/v2/users/${userId}/groups/roles`
  )
    .then((res) => res.json())
    .then((groups) => groups.data);
  if (robloxUserGroups) {
    for (const group of robloxUserGroups) {
      userGroupRoles.push(group.role.id);
    }
  }

  // check if user has any allowed group roles
  for (const role of Object.keys(allowedGroupRoles)) {
    if (userGroupRoles.includes(parseInt(role))) {
      console.log('user has allowed group role', role);
      isAllowed = true;
      groupScanData = mergician(mergicianOptions)(groupScanData, allowedGroupRoles[role]?.scanData || {});
      // get scan data from allowed groups' access groups
      for (const group of sortByPriority(organization, allowedGroupRoles[role]?.accessGroups)) {
        if (organization.accessGroups[group]?.config?.active) {
          groupScanData = mergician(mergicianOptions)(groupScanData, organization.accessGroups[group]?.scanData || {});
          console.log('adding scan data from access group', group);
        }
      }
    }
  }

  // check if card number is allowed

  // update global statistics, increment total scans and either granted or denied scans
  // await dbStatistics.updateOne(
  //   { id: 'global' },
  //   {
  //     $inc: {
  //       [`scans.total`]: 1,
  //       [`scans.${isAllowed ? 'granted' : 'denied'}`]: 1
  //     }
  //   }
  // );
  await updateOne(
    'statistics',
    { id: 'global' },
    { $inc: { [`scans.total`]: 1, [`scans.${isAllowed ? 'granted' : 'denied'}`]: 1 } }
  );

  // update organization statistics
  // await db.collection('organizations').updateOne(
  //   { id: organization.id },
  //   {
  //     $inc: {
  //       [`statistics.scans.total`]: 1,
  //       [`statistics.scans.${isAllowed ? 'granted' : 'denied'}`]: 1
  //     }
  //   }
  // );
  await updateOne(
    'organizations',
    { id: organization.id },
    { $inc: { [`statistics.scans.total`]: 1, [`statistics.scans.${isAllowed ? 'granted' : 'denied'}`]: 1 } }
  );

  // webhook event
  try {
    if (accessPoint?.config?.webhook?.url) {
      if (
        !(isAllowed && !accessPoint?.config?.webhook?.eventGranted) &&
        !(!isAllowed && !accessPoint?.config?.webhook?.eventDenied)
      ) {
        const webhook = accessPoint?.config?.webhook;
        // const user = await dbUsers
        //   .findOne(
        //     { 'roblox.id': userId },
        //     {
        //       projection: {
        //         id: 1,
        //         displayName: 1,
        //         username: 1,
        //         roblox: 1,
        //         avatar: 1
        //       }
        //     }
        //   )
        //   .then((user: User) => user);
        const user = await findOne(
          'users',
          { 'roblox.id': userId },
          { id: 1, displayName: 1, username: 1, roblox: 1, avatar: 1 }
        );
        let member = organization.members[user?.id] || {
          type: 'roblox',
          id: userId
        };
        if (member?.type === 'roblox') {
          const robloxUsers = await getRobloxUsers([member.id]);
          member.displayName = robloxUsers[member.id].displayName;
          member.username = robloxUsers[member.id].name;
        } else {
          member.displayName = user?.displayName;
          member.roblox = user?.roblox;
          member.avatar = user?.avatar;
        }

        const avatarUrl = `${process.env.NEXT_PUBLIC_ROOT_URL}/images/logo-square.jpeg`;
        const webhookRes = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'XCS',
            avatar_url: avatarUrl,
            embeds: [
              {
                title: 'Access Scan Event',
                description: `A user has scanned ${accessPoint?.name}.`,
                color: isAllowed ? 0x16db65 : 0xdb1616,
                thumbnail: {
                  url: member?.avatar || avatarUrl
                },
                author: {
                  name: 'Restrafes XCS',
                  url: 'https://xcs.restrafes.co',
                  icon_url: avatarUrl
                },
                fields: [
                  {
                    name: (member?.type !== 'roblox' ? 'XCS' : 'Roblox') + ' User',
                    value:
                      member?.type === 'roblox'
                        ? `${member.displayName} (${userId})`
                        : `${member.displayName} (@${member?.roblox?.username}) (${userId})`
                  },
                  {
                    name: 'Access Point',
                    value: `${accessPoint?.name} (${location?.name})`
                  },
                  {
                    name: 'Organization',
                    value: organization?.name
                  },
                  {
                    name: 'Scan Result',
                    value: isAllowed ? 'Access Granted' : 'Access Denied'
                  },
                  {
                    name: 'Scan Time',
                    value: timestamp.toLocaleString('en-US', {
                      timeZone: 'America/New_York'
                    })
                  }
                ],
                footer: {
                  text: `If you wish to disable these messages, reconfigure the webhook from the access point's configuration page.`
                }
              }
            ]
          })
        });
      }
    }
  } catch (error) {
    console.error(error);
  }

  if (isAllowed) {
    let scanData = {} as any;
    const memberId = allowedRobloxIds[userId as string];
    const memberGroups = allowedOrganizationMembers[memberId as string];

    // xcs group scan data
    if (memberGroups) {
      for (const group of Object.values(memberGroups) as any) {
        if (organization.accessGroups[group]?.config?.active) {
          scanData = mergician(mergicianOptions)(scanData, organization.accessGroups[group]?.scanData || {});
        }
      }
    }

    // roblox group scan data
    if (groupScanData) {
      scanData = mergician(mergicianOptions)(scanData, groupScanData);
    }

    // user scan data, user scan data overrides group scan data
    scanData = mergician(mergicianOptions)(scanData, organization.members[memberId]?.scanData || {});

    // access point scan data, access point scan data comes before everything else
    scanData = mergician(mergicianOptions)(
      accessPoint.config?.scanData?.ready || {},
      accessPoint.config?.scanData?.granted || {},
      scanData
    );

    // res.status(200).json({
    //   success: true,
    //   grant_type: 'user_scan',
    //   response_code: 'access_granted',
    //   scan_data: scanData || {}
    // });
    return NextResponse.json(
      {
        success: true,
        grant_type: 'user_scan',
        response_code: 'access_granted',
        scan_data: scanData || {}
      },
      { status: 200 }
    );
  } else {
    // res.status(200).json({
    //   success: true,
    //   grant_type: 'user_scan',
    //   response_code: 'access_denied',
    //   scan_data: accessPoint.config?.scanData?.denied || {}
    // });
    return NextResponse.json(
      {
        success: true,
        grant_type: 'user_scan',
        response_code: 'access_denied',
        scan_data: accessPoint.config?.scanData?.denied || {}
      },
      { status: 200 }
    );
  }
}
