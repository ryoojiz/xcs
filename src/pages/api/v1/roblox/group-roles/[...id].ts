import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  let response = await fetch(`https://groups.roblox.com/v1/groups/${id}/roles`).then((res) => res.json());
  if (response.errors) return res.status(404).json({ success: false, message: 'Group not found.' });

  // remove the Guest role
  response.roles = response.roles.filter((role: any) => role.name !== 'Guest');
  res.status(200).json(response.roles);
}
