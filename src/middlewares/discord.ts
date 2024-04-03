import { DiscordInteractionApiHandler } from '@/types';
import { APIApplicationCommandInteraction } from 'discord-api-types/v8';
import { NextApiRequest, NextApiResponse } from 'next';
import nacl from 'tweetnacl';

import { parseRawBodyAsString } from '@/lib/body-parser';

const publicKey = process.env.DISCORD_PUBLIC_KEY;

if (!publicKey) {
  throw new Error('Environment variables are not configured properly.');
}

export type VerifyHeadersArgs = {
  timestamp: string;
  rawBody: string;
  signature: string;
};

export const verifyHeaders = ({ timestamp, rawBody, signature }: VerifyHeadersArgs) => {
  return nacl.sign.detached.verify(
    Buffer.from(timestamp + rawBody),
    Buffer.from(signature, 'hex'),
    Buffer.from(publicKey, 'hex')
  );
};

// middleware to verify the request came from Discord
const withDiscordInteraction =
  (next: DiscordInteractionApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    if (typeof signature !== 'string' || typeof timestamp !== 'string') {
      return res.status(401).end('Invalid request signature.');
    }

    try {
      const rawBody = await parseRawBodyAsString(req);
      const isVerified = verifyHeaders({ timestamp, rawBody, signature });
      if (!isVerified) {
        return res.status(401).end('Invalid request signature.');
      }

      // Parse the message as JSON
      const interaction: APIApplicationCommandInteraction = JSON.parse(rawBody);
      const {
        type
      }: {
        type: number;
      } = interaction;

      if (type === 1) {
        return res.status(200).json({ type: 1 });
      } else {
        return await next(req, res, interaction);
      }
    } catch (err) {
      return res.status(500).json({
        statusCode: 500,
        message: 'Something went wrong while parsing the request.'
      });
    }
  };

export default withDiscordInteraction;
