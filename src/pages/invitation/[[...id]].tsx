/* eslint-disable react-hooks/rules-of-hooks */
import Head from 'next/head';
import { useRouter } from 'next/router';

import Invitation from '@/components/Invitation';

export async function getServerSideProps({ query }: any) {
  if (!query.id) {
    return {
      props: {
        invite: null,
        errorMessage: null
      }
    };
  }

  let errorMessage = null;
  const invite = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/invitations/${query.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then((res) => res.json())
    .then((ret) => {
      if (ret.invitation) {
        return ret.invitation;
      } else {
        errorMessage = ret.message;
        return null;
      }
    });

  return {
    props: {
      invite: invite || null,
      errorMessage
    }
  };
}

export default function Invite({ invite, errorMessage }: { invite: any; errorMessage: string | null }) {
  const { query } = useRouter();

  const inviteTypeSwitch = (type: string) => {
    switch (type) {
      case 'organization':
        return 'join their organization';
      case 'xcs':
        return 'create an account';
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Invitation - Restrafes XCS</title>

        {invite ? (
          <>
            <meta
              name="og:site_name"
              content={'Restrafes XCS'}
            />
            <meta
              name="og:title"
              content={'Invitation - Restrafes XCS'}
            />
            <meta
              name="og:url"
              content={`https://xcs.restrafes.co/invite/${query.id}`}
            />
            <meta
              name="og:type"
              content="website"
            />
            <meta
              name="og:image"
              content={invite.creator.avatar}
            />
            <meta
              name="og:description"
              content={`You've been invited by ${invite?.creator.displayName || invite.creator.name.first} to ${inviteTypeSwitch(invite.type) || 'join their organization'
                }.`}
            />
          </>
        ) : null}
      </Head>
      <Invitation invite={invite} errorMessage={errorMessage} />
    </>
  );
}
