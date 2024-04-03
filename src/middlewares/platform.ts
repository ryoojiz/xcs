import { tokenToID } from '@/pages/api/firebase';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const withPlatformMiddleware = (next: NextApiRequest) => async (req: NextApiRequest, res: NextApiResponse) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  const uid = await tokenToID(token as string);

  if (!uid) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }

  NextResponse.next();
};

export default withPlatformMiddleware;
