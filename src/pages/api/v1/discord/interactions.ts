import withDiscordInteraction from '@/middlewares/discord';
import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';

const nacl = require('tweetnacl');

const roleId = '1127011693868896346';
const guildId = '1127003608366460978';
const publicKey = process.env.DISCORD_PUBLIC_KEY as string;

const BASE_RESPONSE = { type: 4, flags: 1 << 6 };
const INVALID_COMMAND_RESPONSE = {
  ...BASE_RESPONSE,
  data: { content: 'Command not found.' }
};
const XCS_ROLE_DENIED_RESPONSE = {
  ...BASE_RESPONSE,
  data: { content: 'Your Discord account is not linked to an XCS account.' }
};
const PING_COMMAND_RESPONSE = { ...BASE_RESPONSE, data: { content: 'Pong!' } };

// disable body parsing, need the raw body as per https://discord.com/developers/docs/interactions/slash-commands#security-and-authorization
export const config = {
  api: {
    bodyParser: false
  }
};

const handler = async (_: NextApiRequest, res: NextApiResponse, interaction: any) => {
  const {
    data: { name, options }
  } = interaction;

  switch (name) {
    case 'ping':
      return res.status(200).json(PING_COMMAND_RESPONSE);
    case 'xcs-role':
      // get XCS role
      const discordId = interaction.member.user.id;

      if (interaction.member.roles.includes(roleId)) {
        return res.status(200).json({
          ...BASE_RESPONSE,
          data: { content: 'You already have the XCS role.' }
        });
      }

      const mongoClient = await clientPromise;
      const db = mongoClient.db(process.env.MONGODB_DB as string);
      const users = db.collection('users');
      const user = await users.findOne({ 'discord.id': discordId }, { projection: { id: 1 } });

      if (!user) {
        return res.status(200).json(XCS_ROLE_DENIED_RESPONSE);
      } else {
        const ret = await fetch(`https://discord.com/api/guilds/${guildId}/members/${discordId}/roles/${roleId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'X-Audit-Log-Reason': 'XCS role granted via /xcs command'
          }
        }).then((ret) => ret);

        if (ret.status !== 204) {
          return res.status(200).json({
            ...BASE_RESPONSE,
            data: { content: 'Something went wrong.' }
          });
        } else {
          return res.status(200).json({
            ...BASE_RESPONSE,
            data: { content: 'You have been granted the XCS role.' }
          });
        }
      }
      break;
    default:
      return res.status(200).json(INVALID_COMMAND_RESPONSE);
  }
};

export default withDiscordInteraction(handler);
