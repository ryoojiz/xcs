// @ts-ignore
import mergician from 'mergician';
import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';
// @ts-ignore
import { getRobloxUsers } from '@/lib/utils';
import { Organization, OrganizationMember, ScanEvent } from '@/types';
import { generate as generateString } from 'randomstring';

const mergicianOptions = { appendArrays: true, dedupArrays: true };

const sortByPriority = (organization: Organization, array: string[]) => {
  return array.sort((a, b) => {
    return (organization.accessGroups[a]?.priority || 0) - (organization.accessGroups[b]?.priority || 0);
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  let { locationId, accessPointId, apiKey, userId, cardNumbers, universeId } = req.query as {
    locationId: string;
    accessPointId: string;
    apiKey: string;
    userId: string;
    cardNumbers: string;
    universeId: string;
  };

  if (locationId === 'UPTIME') return res.status(200).json({ success: true });

  const mongoClient = await clientPromise;

  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const dbAccessPoints = db.collection('accessPoints');
  const dbLocations = db.collection('locations');
  const dbOrganizations = db.collection('organizations');
  const dbUsers = db.collection('users');
  const dbStatistics = db.collection('statistics');
  const timestamp = new Date();

  // check if API key is empty
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'No API key provided.' });
  }

  // get location
  const location = await dbLocations.findOne({ id: locationId });
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found.' });
  }

  // get organization
  const organization = (await dbOrganizations.findOne({
    id: location.organizationId
  })) as unknown as Organization;
  if (!organization) {
    return res.status(404).json({ success: false, message: 'Organization not found.' });
  }

  // check API key
  if (!((apiKey as string) in organization.apiKeys)) {
    return res.status(401).json({ success: false, message: 'Invalid API key.' });
  }

  // get access point
  const accessPoint = await dbAccessPoints.findOne({ id: accessPointId }, { projection: { _id: 0 } });
  if (!accessPoint) {
    return res.status(404).json({ success: false, message: 'Access point not found.' });
  }

  // TODO: finish this

  // check if access point is active, if not, deny access
  if (!accessPoint.config.active) {
    return res.status(200).json({
      success: true,
      grant_type: 'access_point_inactive',
      response_code: 'access_denied',
      scan_data: accessPoint.config?.scanData?.denied || {}
    });
  }

  // check if access point is armed, if not, grant access
  if (!accessPoint.config.armed) {
    return res.status(200).json({
      success: true,
      grant_type: 'access_point_unarmed',
      response_code: 'access_granted',
      scan_data: accessPoint.config?.scanData?.granted || {}
    });
  }

  const allowedGroups = accessPoint.config.alwaysAllowed.groups;
  const allowedMembers = accessPoint.config.alwaysAllowed.members || [];

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

  // get all organization members that are allowed
  for (const memberId of allowedMembers) {
    if (!((memberId as string) in allowedOrganizationMembers)) {
      const member = organization.members[memberId];
      allowedOrganizationMembers[memberId] = member.accessGroups;

      // add open access groups to the user's allowed groups
      allowedOrganizationMembers[memberId] = mergician(mergicianOptions)(allowedOrganizationMembers[memberId], {
        openAccessGroups
      });
    }
  }

  // fetch all roblox ids from allowed users
  let allowedRobloxIds = {} as any;
  for (const memberId of Object.keys(allowedOrganizationMembers)) {
    const member = organization.members[memberId];
    if (member.type === 'roblox') {
      allowedRobloxIds[member.id] = memberId;
    } else {
      const user = await dbUsers.findOne({ id: memberId }).then((user) => user);
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
      if (allowedGroups.includes(accessGroup) || allowedMembers.includes(member.id)) {
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
      // check if the string is a range (start-end)
      const regex = /^(\d+)-(\d+)$/;
      for (const cardNumber of organization.members[memberId]?.cardNumbers || []) {
        const range = cardNumber.match(regex);
        if (range) {
          for (let i = parseInt(range[1]); i <= parseInt(range[2]); i++) {
            allowedCardNumbers.push(i.toString());
          }
        } else {
          allowedCardNumbers = allowedCardNumbers.concat(organization.members[memberId].cardNumbers as any);
        }
      }
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

  // update global statistics
  await dbStatistics.updateOne(
    { id: 'global' },
    {
      $inc: {
        [`scans.total`]: 1,
        [`scans.${isAllowed ? 'granted' : 'denied'}`]: 1
      }
    }
  );

  // update organization statistics
  await db.collection('organizations').updateOne(
    { id: organization.id },
    {
      $inc: {
        [`statistics.scans.total`]: 1,
        [`statistics.scans.${isAllowed ? 'granted' : 'denied'}`]: 1
      }
    }
  );

  const user = await dbUsers
    .findOne(
      { 'roblox.id': userId },
      {
        projection: {
          id: 1,
          displayName: 1,
          username: 1,
          roblox: 1,
          avatar: 1
        }
      }
    )
    .then((user) => user);

  // log scan
  let scanId;

  // generate a random scan id
  do {
    scanId = generateString({
      length: 16,
      charset: 'alphanumeric'
    });
  } while (await db.collection('scanEvents').findOne({ id: scanId }));

  await db.collection('scanEvents').insertOne({
    id: scanId,
    organizationId: organization.id,
    locationId: location.id,
    accessPointId: accessPoint.id,

    roblox: {
      id: userId,
      displayName: user?.displayName,
      username: user?.roblox?.username
    },
    userId: user?.id,

    status: isAllowed ? 'granted' : 'denied',

    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) // 7 days
  } as ScanEvent);

  // webhook event
  try {
    if (accessPoint?.config?.webhook?.url) {
      if (
        !(isAllowed && !accessPoint?.config?.webhook?.eventGranted) &&
        !(!isAllowed && !accessPoint?.config?.webhook?.eventDenied)
      ) {
        const webhook = accessPoint?.config?.webhook;
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
                  url: 'https://wyre.ryj.my.id',
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

    res.status(200).json({
      success: true,
      grant_type: 'user_scan',
      response_code: 'access_granted',
      scan_data: scanData || {}
    });
  } else {
    res.status(200).json({
      success: true,
      grant_type: 'user_scan',
      response_code: 'access_denied',
      scan_data: accessPoint.config?.scanData?.denied || {}
    });
  }
}
