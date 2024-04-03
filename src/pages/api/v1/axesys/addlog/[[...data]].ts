import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data } = req.query;

  // if (!data) {
  //   return res.status(400).json({ error: "Missing data" });
  // }

  // let apiKey = data[0];
  // let locationId = data[1];

  console.log(`[AXESYS] /api/v1/axesys/addlog/: ${data}`);
  return res.status(200).json({ response: 'ok' });
}
