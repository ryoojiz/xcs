import { authToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Organization } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    console.log(req.method);
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const uid = await authToken(req);
  if (!uid) return res.status(401).json({ message: 'Unauthorized.' });

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);

  let organizations = (await db
    .collection('organizations')
    .find(
      { [`members.${uid}`]: { $gt: { role: 0 } } },
      {
        projection: {
          id: 1,
          name: 1,
          description: 1,
          avatar: 1,
          members: 1,
          statistics: 1,
          updatedAt: 1,
          createdAt: 1,
          updatedById: 1,
          updatedBy: 1
        }
      }
    )
    .toArray()) as unknown as Organization[];

  organizations = (await Promise.all(
    organizations.map(async (organization: Organization) => {
      let ownerId = Object.keys(organization.members).find(
        (memberId: string) =>
          organization.members[memberId].role === 3 || organization.members[memberId].permissions?.organization.owner
      );
      let owner = await db
        .collection('users')
        .findOne({ id: ownerId }, { projection: { id: 1, displayName: 1, username: 1, avatar: 1 } });

      // add statistics onto data
      let numLocations = await db.collection('locations').countDocuments({ organizationId: organization.id });
      let numMembers = Object.keys(organization.members).length;

      // get last updated user
      let updatedBy = await db.collection('users').findOne(
        { id: organization.updatedById },
        {
          projection: {
            id: 1,
            displayName: 1,
            username: 1,
            avatar: 1
          }
        }
      );

      return {
        ...organization,
        owner,
        updatedBy,
        statistics: {
          numLocations,
          numMembers
        }
      };
    })
  )) as unknown as Organization[];

  res.status(200).json({ organizations: organizations });
}
