import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // get API key from request header
  const apiKey = req.headers['Authorization'];
  if (!apiKey) return res.status(401).json({ message: 'Unauthorized.' });

  return res.status(200).json({
    message: 'API v2 endpoint / does not exist.'
  });
}
