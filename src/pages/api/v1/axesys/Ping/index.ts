import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[AXESYS] /api/v1/axesys/Ping`);
  return res.status(200).send('Pong!');
}
