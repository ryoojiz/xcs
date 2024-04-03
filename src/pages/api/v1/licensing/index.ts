import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';

// number to boolean
const bv = (v: string) => {
  switch (v) {
    case '0':
      return false;
    case '1':
      return true;
    default:
      return false;
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== 'GET') {
    res.status(400).json({ success: false, error: 'Bad request' });
    return;
  }

  // request parameters
  const { id } = req.query as { id: string };

  // reject if id is missing
  if (!id) {
    res.status(200).json({ success: false, error: 'Missing id parameter' });
    return;
  }

  // connect to mongodb
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB as string);

  // get licenses
  const licenses = await db.collection('licenses').find({ subjectId: id }).toArray();

  // no licenses under this id found
  if (licenses.length === 0) {
    res.status(200).json({
      success: true,
      subjectId: id,
      groupId: '-1',
      productsOwned: {
        monospace0: false,
        polaris0: false,
        hera0: false
      }
    });
    return;
  }

  // get first license, convert binary representations to boolean
  const license = licenses[0];
  const productsOwned = {
    monospace0: bv(license.monospace0),
    polaris0: bv(license.polaris0),
    hera0: bv(license.hera0)
  };

  res.status(200).json({
    success: true,
    subjectId: id,
    groupId: '-1',
    productsOwned
  });
};

export default handler;
