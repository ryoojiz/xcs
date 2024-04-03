import { NextApiRequest, NextApiResponse } from 'next';

const requestIP = require('request-ip');
const ispWhitelist = ['Roblox'];

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const ip = req.headers['x-real-ip'] || requestIP.getClientIp(req);

  const geoInfo = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/ip-api/json/${ip}`);
  const geoInfoJson = await geoInfo.json();

  if (geoInfoJson.status === 'fail') {
    return res.status(500).json({
      success: false,
      allowed: false,
      ip: ip,
      message: 'Failed to get IP address'
    });
  }

  return res.status(200).json({
    success: true,
    allowed: ispWhitelist.includes(geoInfoJson.isp),
    ip: ip,
    isp: geoInfoJson.isp
  });
};

export default handler;
