import { AccessGroup, Organization } from '@/types';

export const roleToText = (role: number) => {
  role = Number(role);
  switch (role) {
    case 0:
      return 'Guest';
    case 1:
      return 'Member';
    case 2:
      return 'Manager';
    case 3:
      return 'Owner';
    default:
      return 'Member';
  }
};

export const textToRole = (role: string) => {
  role = role.toString().toLowerCase();
  switch (role) {
    case 'guest':
      return 0;
    case 'member':
      return 1;
    case 'manager':
      return 2;
    case 'owner':
      return 3;
    default:
      return 1;
  }
};

export interface RobloxUserByUsernamesResponseValue {
  requestedUsername: string;
  hasVerifiedBadge: boolean;
  id: number;
  name: string; // username
  displayName?: string;
}

export const getRobloxUsersByUsernames = async (usernames: string[]) => {
  if (!usernames.length) return {};
  let robloxResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/users/v1/usernames/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      usernames,
      excludeBannedUsers: false
    })
  })
    .then((res) => res.json())
    .then((res) => res.data)
    .catch((err) => {
      return [];
    });

  return robloxResponse as RobloxUserByUsernamesResponseValue[];
};

export interface RobloxUserResponseValue {
  id: number;
  name: string; // username
  displayName?: string;
  avatar?: string;
  hasVerifiedBadge: boolean;
}

export const getRobloxUsers = async (userIds: string[]) => {
  if (!userIds.length) return {};
  let robloxResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/users/v1/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userIds,
      excludeBannedUsers: false
    })
  })
    .then((res) => res.json())
    .then((res) => res.data)
    .catch((err) => {
      return {};
    });

  let robloxUserAvatar = await fetch(
    `${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/thumbnails/v1/users/avatar-headshot?userIds=${userIds.join(
      ','
    )}&size=150x150&format=Png&isCircular=false`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
    .then((res) => res.json())
    .then((res) => res.data);

  if (!robloxResponse || !robloxUserAvatar) {
    console.warn('No roblox users found', robloxResponse, robloxUserAvatar);
    return {};
  }

  for (let i = 0; i < robloxResponse.length; i++) {
    // find the avatar from targetId
    const avatar = robloxUserAvatar.find((a: any) => a.targetId === robloxResponse[i].id);
    robloxResponse[i].avatar = avatar?.imageUrl;
  }

  let response = Object();

  // convert array to object, with userId as key
  for (let i = 0; i < robloxResponse.length; i++) {
    response[robloxResponse[i].id as string] = robloxResponse[i];
  }

  return response;
};

export const getRobloxGroups = async (groupIds: string[]) => {
  if (!groupIds.length) return {};
  let robloxResponse = await fetch(
    `${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/groups/v2/groups?groupIds=${groupIds?.join(',') || 0}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
    .then((res) => res.json())
    .then((res) => res.data);

  let robloxGroupThumbnail = await fetch(
    `${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/thumbnails/v1/groups/icons?groupIds=${groupIds.join(
      ','
    )}&size=150x150&format=Png&isCircular=false`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
    .then((res) => res.json())
    .then((res) => res.data)
    .catch((err) => {
      return {};
    });

  if (!robloxResponse) {
    console.warn('No roblox groups found', robloxResponse);
    return {};
  }

  for (let i = 0; i < robloxResponse.length; i++) {
    // find the avatar from targetId
    const avatar = robloxGroupThumbnail.find((a: any) => a.targetId === robloxResponse[i].id);
    robloxResponse[i].avatar = avatar?.imageUrl;
  }

  // get roles for each group
  for (let i = 0; i < robloxResponse.length; i++) {
    let robloxGroupRoles = await fetch(
      `${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/groups/v1/groups/${robloxResponse[i].id}/roles`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
      .then((res) => res.json())
      .then((res) => res.roles);
    robloxResponse[i].roles = robloxGroupRoles;
  }

  let response = Object();

  // convert array to object, with groupId as key
  for (let i = 0; i < robloxResponse.length; i++) {
    response[robloxResponse[i].id as string] = robloxResponse[i];
  }

  return response;
};

export const getRandomAccessPointName = () => {
  let accessPointNames = [
    'Main Entrance',
    'Lobby Left',
    'Lobby Right',
    'Service Corridor',
    'Parking Entry',
    'Elevator Hall',
    'Roof Access',
    'Rear Exit',
    'Basement Door',
    'Loading Dock',
    'Conference Room',
    'West Wing Entry',
    'East Wing Entry',
    'Executive Suite',
    'Fitness Center Door',
    'Penthouse Floor',
    'Pool Area',
    'Library Access',
    'Cafeteria Entry',
    'Maintenance Room',
    'Security Desk',
    'Stairwell A',
    'Stairwell B',
    'Emergency Exit'
  ];

  return accessPointNames[Math.floor(Math.random() * accessPointNames.length)];
};

export const getRandomLocationName = () => {
  let locationNames = [
    'Titan Towers',
    'Horizon Heights',
    'Silver Skyline',
    'Eclipse Estates',
    'Pinnacle Point',
    'Crown Crest',
    'Azure Altitude',
    'Summit Structures',
    'Peak Plaza',
    'Twilight Tower',
    'Rise Residences',
    'Stratosphere Suites',
    'Nimbus Nook',
    'Skyward Sanctum',
    'Celestial Center',
    'Lunar Loft',
    'Olympus Offices',
    'Vista View',
    'Polaris Place',
    'Galaxy Gateway',
    'Nebula Nexus',
    'Atlas Atrium'
  ];

  return locationNames[Math.floor(Math.random() * locationNames.length)];
};

export const getRandomOrganizationName = () => {
  let organizationNames = [
    'Halcyon Industries',
    'Prometheus Labs',
    'Athena Robotics',
    'Helix Technologies',
    'Cortex Systems',
    'Apex Aerospace',
    'Hollow Enterprises',
    'Aperture Science',
    'Hera Labs',
    'Guardia Corporation',
    'Hyperion Corporation',
    'Stark Industries',
    'Gattaca Aerospace',
    'Kronos Technologies',
    'Atlas Robotics',
    'Hades Computing',
    'Luna Systems'
  ];

  return organizationNames[Math.floor(Math.random() * organizationNames.length)];
};

export const agNames = (organization: any, names: string[]) => {
  if (!organization?.accessGroups) {
    console.warn('No access groups found', organization, names);
    return [];
  }
  let res = [];
  for (let name of names) {
    let find = Object.keys(organization.accessGroups).find(
      (element: any) => organization.accessGroups[element].name === name
    );
    if (find) {
      res.push(find);
    }
  }
  return res;
};

export const agIds = (organization: any, ids: string[]) => {
  if (!organization?.accessGroups) return [];
  let res = [];
  for (let id of ids) {
    let find = Object.keys(organization.accessGroups).find(
      (element: any) => organization.accessGroups[element].id === id
    );
    if (find) {
      res.push(organization.accessGroups[find].name);
    }
  }
  return res;
};

export const agKV = (organization: any) => {
  if (!organization?.accessGroups) return [];
  let res = [];
  for (let key of Object.keys(organization.accessGroups)) {
    res.push({
      label: organization.accessGroups[key].name,
      value: organization.accessGroups[key].name
    });
  }
  return res;
};

export const getAccessGroupType = (organization: Organization, ag: AccessGroup) => {
  if (ag.type === 'organization') {
    return 'Organization';
  } else if (ag.type === 'location') {
    // get location name
    // const location = Object.values(
    //   organization?.locations as AccessGroup[]
    // ).find((l: any) => l.id === ag.id);
    return 'Unknown';
  } else {
    return ag.type;
  }
};

export const getAccessGroupOptions = (organization: Organization) => {
  if (!organization) return [];
  const ags = Object.values(organization?.accessGroups) || [];
  interface Group {
    label: string;
    options: {
      label: string;
      value: string;
    }[];
  }
  let groups = [] as any;

  ags.forEach((ag: AccessGroup) => {
    // check if the group is already in the groups object
    if (groups.find((g: Group) => g.label === getAccessGroupType(organization, ag))) {
      // if it is, add the option to the options array
      groups
        .find((g: Group) => g.label === getAccessGroupType(organization, ag))
        .options.push({
          label: ag.name,
          value: ag.id
        });
    } else {
      // if it's not, add the group to the groups array
      groups.push({
        label: getAccessGroupType(organization, ag),
        options: [
          {
            label: ag.name,
            value: ag.id
          }
        ]
      });
    }
  });

  // sort the groups so organizations are at the bottom
  groups.sort((a: Group, b: Group) => {
    if (a.label === 'Organization') return 1;
    if (b.label === 'Organization') return -1;
    return 0;
  });

  return groups;
};

// export {
//   agIds,
//   agKV,
//   agNames,
//   getAccessGroupOptions,
//   getAccessGroupType,
//   getRandomAccessPointName,
//   getRandomLocationName,
//   getRandomOrganizationName,
//   getRobloxGroups,
//   getRobloxUsers,
//   getRobloxUsersByUsernames,
//   roleToText,
//   textToRole
// };
