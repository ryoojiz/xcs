import { APIApplicationCommandInteraction, APIInteractionResponse } from 'discord-api-types/v8';
import { NextApiRequest, NextApiResponse } from 'next';

export interface Alert {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'warning' | 'error';
  createdAt: string;
}
export interface User {
  id: string;
  name?: {
    first: string;
    last?: string;
    privacyLevel: number;
  }; // deprecated
  displayName: string;
  username: string;
  bio?: string | null;
  avatar: string;
  sponsorId?: string;
  email: {
    address: string;
    privacyLevel: number;
  };
  roblox: {
    id: string | null;
    displayName?: string | null;
    username?: string | null;
    verified: boolean;
  };
  discord: {
    id?: string | number | null;
    username?: string | null;
    discriminator?: string | null;
    verified: boolean;
    verifiedAt?: Date | string | null;
  };
  platform: {
    demo?: boolean;
    staff: number | boolean;
    staffTitle?: string | null;
    membership: number;
    invites: number;
  };
  statistics?: {
    referrals: number;
    scans: number;
    organizationInvitations?: number;
  };
  achievements?: Record<string, Achievement>;
  organizations?: Organization[];
}

export interface Organization {
  id: string;

  name: string;
  ownerId: string;
  owner?: User;
  description: string;
  isPersonal: boolean;

  members: Record<string, OrganizationMember>;
  logs: any[];
  apiKeys: Record<string, any>;

  createdAt: any;
  updatedAt: any;
  updatedById?: string;
  updatedBy?: User;

  avatar?: string;
  accessGroups: Record<string, AccessGroup>;

  verified?: boolean;

  // not stored in mongoDB, but added to organization data on some endpoints
  self?: OrganizationMember;
  canEdit?: boolean;
  statistics: {
    numLocations?: number;
    numMembers?: number;
    numAccessGroups?: number;
    scans: {
      total: number;
      granted: number;
      denied: number;
    };
  };
}

export interface OrganizationMember {
  type: 'user' | 'roblox' | 'roblox-group' | 'card';
  id: string;
  role: number;
  accessGroups: string[];
  scanData?: any;
  permissions?: {
    all: boolean;
    organization: {
      owner: boolean;
      edit: boolean;
      members: {
        create: boolean;
        edit: boolean;
        delete: boolean;
      };
    };
    locations: {
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    accessPoints: {
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    accessGroups: {
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
  };
  formattedId?: string;

  name?: string;
  displayName?: string;
  username?: string;
  avatar?: string;

  groupName?: string;
  groupRoles?: number[];
  roleset?: any[];

  cardNumbers?: string[];

  roblox?: {
    id: string;
    displayName?: string;
    username?: string;
  };

  joinedAt: string | Date;
  updatedAt?: string | Date;
}
export interface Location {
  id: string;
  name: string;
  description?: string;
  tags: [];
  organizationId: string;
  organization?: Organization;
  avatar?: string;
  roblox: {
    place?: RobloxAPIResponsePlace;
    placeId?: number | string;
    universe?: {
      id: number | string;
    };
  };
  enabled: true;
  createdAt: string;
  updatedAt: string;
}

export interface AccessGroup {
  id: string;
  name: string;
  type: 'organization' | 'location';
  description: string;
  priority?: number;
  scanData?: any;
  config: {
    active: boolean;
    openToEveryone: boolean;
  };
  locationName?: string;
  locationId?: string;
}

export interface AccessPoint {
  id: string;
  name: string;
  description: string;
  locationId: string;
  organizationId: string;

  organization?: Organization;
  location?: Location;

  tags: string[];
  config: {
    active: boolean;
    armed: boolean;
    unlockTime: number;
    alwaysAllowed: {
      users?: string[]; // deprecated for members
      members: string[];
      groups: string[];
      cards: string[];
    };
    webhook: {
      url: string;
      eventGranted: boolean;
      eventDenied: boolean;
    };
    scanData?: {
      disarmed: any;
      ready: any;
      granted: any;
      denied: any;
    };
  };
  updatedById?: string;
  updatedBy?: User;
  updatedAt: string;
  createdAt: string;
  createdBy: string;
}

export type DiscordInteractionApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse<APIInteractionResponse>,
  interaction: APIApplicationCommandInteraction
) => void | Promise<void>;

export interface Dialog {
  title?: string;
  description?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  callback?: () => void;
}

export interface Invitation {
  type: 'xcs' | 'organization';
  code: string;
  isSponsor?: boolean;

  organizationId?: string;
  role?: number;
  organization?: Organization;

  uses: number;
  maxUses: number;
  startingReferrals?: number;

  comment?: string;

  createdBy: string;
  createdAt: string;
  creator?: User;
}

export interface OrganizationInvitation {
  id: string;
  recipientId: string;
  organizationId: string;
  comment?: string;

  organization?: Organization;
  recipient?: User;
  createdBy?: User;

  role: number;
  accessGroups: string[];

  createdById: string;
  createdAt: string | Date;
  expiresAt?: string | Date | -1;
}

export interface Notification {
  id: string;
  recipient: string;
  type: 'alert' | 'organization-invitation';
  read: boolean;
  data: {
    status: 'success' | 'info' | 'warning' | 'error';
    title: string;
    description?: string;
    icon?: string;
    link?: string;
  };
  createdAt: string;
  expiresAt?: string | Date | -1;
}

export interface RobloxAPIResponsePlace {
  id: number;
  rootPlaceId: number;
  name: string;
  description: string;
  sourceName: string | null;
  sourceDescription: string | null;
  creator: {
    id: number;
    name: string;
    type: string;
    isRNVAccount: boolean;
    hasVerifiedBadge: boolean;
  };
  price: number | null;
  allowedGearGenres: string[];
  allowedGearCategories: string[];
  isGenreEnforced: boolean;
  copyingAllowed: boolean;
  playing: number;
  visits: number;
  maxPlayers: number;
  created: string;
  updated: string;
  studioAccessToApisAllowed: boolean;
  createVipServersAllowed: boolean;
  universeAvatarType: string;
  genre: string;
  isAllGenre: boolean;
  isFavoritedByUser: boolean;
  favoritedCount: number;

  thumbnail?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface ScanEvent {
  id: string;

  accessPointId: string;
  locationId: string;
  organizationId: string;

  accessPoint?: AccessPoint;
  location?: Location;
  organization?: Organization;

  roblox: {
    id: string;
    displayName: string;
    username: string;
    avatar: string;
  };
  userId?: string | null;
  user?: User;

  status: 'disarmed' | 'ready' | 'granted' | 'denied';
  scanData?: any;

  createdAt: Date;
  expiresAt: Date;
}
