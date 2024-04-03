import { Location } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // reject non-GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // query parameters
  // /api/v1/axesys/syncdoors/{apiKey}/{locationId}
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ error: 'Missing data' });
  }

  console.log(`[AXESYS] /api/v1/axesys/syncdoors/: ${data}`);

  let accessPointId = data[0];

  // create a connection to the database
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const locations = db.collection('locations');
  const organizations = db.collection('organizations');
  const accessPoints = db.collection('accessPoints');

  // get door
  let accessPoint = await accessPoints.findOne({ id: accessPointId });

  if (!accessPoint) {
    return res.status(404).json({ error: 'Access point not found' });
  }

  let legacyResponse = {} as any;

  legacyResponse[accessPoint.id] = {
    DoorSettings: {
      DoorName: accessPoint.name,
      Active: accessPoint.configuration.active ? '1' : '0',
      Locked: accessPoint.configuration.armed ? '1' : '0',
      Timer: accessPoint.configuration.timer || 8
    },
    AuthorizedUsers: {},
    AuthorizedGroups: {}
  };
  for (let user of accessPoint.configuration.alwaysAllowed.users) {
    legacyResponse[accessPoint.id].AuthorizedUsers[user.robloxId] = user.robloxUsername;
  }

  console.log(legacyResponse);

  return res.status(200).json({
    data: legacyResponse
  });
}

// import { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const { data } = req.query;

//   if (!data) {
//     return res.status(400).json({ error: "Missing data" });
//   }

//   let apiKey = data[0];
//   let locationId = data[1];

//   return res.status(200).json({
//     query: {
//       apiKey,
//       locationId,
//     },
//     data: {
//       // access point id
//       "Lau38N0F": {
//         "DoorSettings": {
//           "DoorName": "Door 1",
//           "Active": "1",
//           "Locked": "1",
//           "Timer": 8,
//         },
//         "AuthorizedUsers": {
//           32757211: "restrafes"
//         }
//       }
//     },
//   });
// }
