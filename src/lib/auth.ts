import { tokenToID } from '@/pages/api/firebase';
import { NextApiRequest } from 'next';

async function authToken(req: NextApiRequest) {
  // authorization Header
  const authHeader = req.headers.authorization;

  // bearer Token
  const token = authHeader?.split(' ')[1];

  // verify Token
  const uid = await tokenToID(token as string);

  return uid;
}

export { authToken };
