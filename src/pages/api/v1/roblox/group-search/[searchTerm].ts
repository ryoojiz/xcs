import { NextApiRequest, NextApiResponse } from 'next';

function isInteger(value: string) {
  return /^\d+$/.test(value);
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { searchTerm } = req.query;
  const response = await fetch(
    `https://groups.roblox.com/v1/groups/search?keyword=${searchTerm}&prioritizeExactMatch=true&limit=10`
  ).then((res) => res.json());
  if (response.errors) return res.status(200).json([]);
  // return res
  //   .status(404)
  //   .json({ success: false, message: "No search results found." });
  res.status(200).json(response.data);
}
