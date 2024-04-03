import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { RobloxUserResponseValue, getRobloxUsers } from '@/lib/utils';
import { AccessPoint, Organization, ScanEvent, User } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    let {
      organizationId,
      search,
      limit = 25,
      skip = 0
    } = req.query as {
      organizationId: string;
      search?: string;
      limit?: string;
      skip?: string;
    };

    const uid = await authToken(req);
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB as string);
    const organization = (await db
      .collection('organizations')
      .findOne({ id: req.query.organizationId as string })) as Organization | null;

    if (!organization) return res.status(404).json({ message: 'Organization not found.' });
    if (!organization.members[uid])
      return res.status(403).json({ message: 'You are not a member of this organization.' });

    let scanEvents = (await db
      .collection('scanEvents')
      .find({ organizationId: organizationId }, {})
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .toArray()) as unknown as ScanEvent[];

    let accessPoints = {} as Record<string, any>;
    let robloxIds = scanEvents.map((scanEvent) => scanEvent.roblox.id) as string[];
    let userIds = scanEvents.map((scanEvent) => scanEvent.userId || undefined) as string[];
    let users = {} as Record<string, unknown | User>;

    const robloxUsers = (await getRobloxUsers(robloxIds)) as Record<string, RobloxUserResponseValue>;
    const accessPointIds = scanEvents.map((scanEvent) => scanEvent.accessPointId) as string[];

    // cache access points
    for (let accessPointId of accessPointIds) {
      if (accessPoints[accessPointId]) continue;
      const accessPoint = await db.collection('accessPoints').findOne({ id: accessPointId });
      if (accessPoint) {
        accessPoints[accessPointId] = accessPoint;
        accessPoints[accessPointId].location = await db.collection('locations').findOne({ id: accessPoint.locationId });
      }
    }

    for (let userId of userIds) {
      const user = await db
        .collection('users')
        .findOne({ id: userId }, { projection: { id: 1, username: 1, displayName: 1, avatar: 1, roblox: 1 } });
      users[userId] = user;
    }

    for (let scanEvent of scanEvents as ScanEvent[]) {
      const robloxUser = robloxUsers[scanEvent.roblox.id];

      scanEvent.roblox = {
        id: robloxUser?.id || 'Unknown',
        displayName: robloxUser?.displayName || 'Unknown',
        username: robloxUser?.name || 'Unknown',
        avatar: robloxUser?.avatar || 'Unknown'
      } as ScanEvent['roblox'];

      scanEvent.accessPoint = accessPoints[scanEvent.accessPointId] as AccessPoint;

      if (scanEvent.userId) scanEvent.user = users[scanEvent.userId] as User;
    }

    return res.status(200).json(scanEvents);
  }
  return res.status(405).json({ message: 'Method not allowed.' });
}
