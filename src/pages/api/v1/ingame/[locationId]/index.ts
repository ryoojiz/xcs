import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';
import { Location, Organization } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const { locationId, apiKey, universeId } = req.query as { locationId: string; apiKey: string; universeId: string };

  const mongoClient = await clientPromise;

  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const dbAccessPoints = db.collection('accessPoints');
  const dbLocations = db.collection('locations');
  const dbOrganizations = db.collection('organizations');

  // check if API key is empty
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'No API key was provided.' });
  }

  // get location
  const location = (await dbLocations.findOne({ id: locationId })) as Location | null;
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found.' });
  }

  // get organization
  const organization = (await dbOrganizations.findOne({
    id: location.organizationId
  })) as Organization | null;
  if (!organization) {
    return res.status(404).json({ success: false, message: 'Organization not found.' });
  }

  // check API key
  if (!(apiKey in organization.apiKeys)) {
    return res.status(401).json({ success: false, message: 'An invalid API key was provided.' });
  }

  if (!universeId) return res.status(400).json({ success: false, message: 'Universe ID mismatch.' });

  const locationUniverseId = location.roblox.universe?.id?.toString();
  if (!locationUniverseId && universeId) {
    // fetch experience details
    const robloxResponse = await fetch(
      `${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/games/v1/games?universeIds=${universeId}`
    )
      .then((res) => res.json())
      .then((res) => res.data);

    if (!robloxResponse || robloxResponse.length === 0) {
      return res.status(400).json({ message: 'Invalid universe ID.' });
    }

    let place = robloxResponse[0];

    const thumbnailResponse = await fetch(
      `${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/roblox/thumbnails/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=256x256&format=Jpeg&isCircular=false`
    )
      .then((res) => res.json())
      .then((res) => res.data);

    if (thumbnailResponse.length === 0) {
      place.thumbnail = null;
    } else {
      place.thumbnail = thumbnailResponse[0].imageUrl;
    }

    // update location
    // set universe ID to universe ID of game and set place
    await dbLocations.updateOne(
      { id: locationId },
      { $set: { 'roblox.universe.id': universeId, 'roblox.place': place } }
    );
  } else {
    // check if universe ID matches game ID
    if (locationUniverseId !== universeId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'The universe ID does not match the universe ID of the location on the XCS website.'
      });
    }
  }

  // get access points
  const accessPoints = await dbAccessPoints.find({ locationId }, { projection: { _id: 0 } }).toArray();

  // convert to object
  const accessPointsObject = {} as any;
  accessPoints.forEach((accessPoint) => {
    accessPointsObject[accessPoint.id] = accessPoint;
    accessPointsObject[accessPoint.id].config.scanData = accessPointsObject[accessPoint.id].config?.scanData || {
      ready: {},
      disarmed: {}
    };
  });

  return res.status(200).json({ success: true, accessPoints: accessPointsObject });
}
