import { getSortedPostsData } from '@/lib/posts';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const allPostsData = await getSortedPostsData();
  res.status(200).json(allPostsData);
}
