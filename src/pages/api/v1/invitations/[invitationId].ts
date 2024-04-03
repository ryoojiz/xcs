import { NextApiRequest, NextApiResponse } from 'next';

import clientPromise from '@/lib/mongodb';
import { Invitation, Organization } from '@/types';

const defaultMessage = 'The invitation you are looking for is either invalid or no longer exists.';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { invitationId } = req.query as { invitationId: string };

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const invitations = db.collection('invitations');
  const organizations = db.collection('organizations');
  const users = db.collection('users');

  let invitation = (await invitations.findOne({
    code: invitationId
  })) as Invitation | null;
  if (!invitation) {
    return res.status(404).json({ valid: false, message: defaultMessage });
  }

  let creator = (await users.findOne(
    { id: invitation.createdBy },
    {
      projection: { id: 1, username: 1, name: 1, avatar: 1, displayName: 1, platform: 1 }
    }
  )) as any;
  if (!creator) {
    return res.status(404).json({ valid: false, message: defaultMessage });
  }

  if (req.method === 'GET') {
    invitation.creator = creator;
    if (invitation?.type === 'organization') {
      let organization = (await organizations.findOne(
        {
          id: invitation.organizationId
        },
        { projection: { id: 1, name: 1, avatar: 1 } }
      )) as unknown as Organization;
      if (!organization) {
        return res.status(404).json({ valid: false, message: defaultMessage });
      }
      invitation.organization = organization;
    } else if (invitation?.type === 'xcs') {
      if (invitation.maxUses > -1 && invitation.uses >= invitation.maxUses) {
        // await invitations.deleteOne({ inviteCode: invitationId });
        return res.status(404).json({
          valid: false,
          message:
            'This invitation has reached its maximum uses. Please contact the creator of this invitation to receive a new one.'
        });
      }

      // if sponsor, check if user has invites left
      if (invitation.isSponsor) {
        if (!creator) {
          return res.status(404).json({ valid: false, message: defaultMessage });
        }
        if (creator.platform.invites < 1) {
          return res.status(403).json({ valid: false, message: 'The sponsor of this code has no invitations left.' });
        }
      }
    }
    return res.status(200).json({ invitation: invitation });
  }

  return res.status(500).json({ message: 'An unknown error has occurred.' });
}
