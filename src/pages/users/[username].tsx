// Components
import Head from 'next/head';
import { useRouter } from 'next/router';

// Authentication
import { useAuthContext } from '@/contexts/AuthContext';

import Layout from '@/layouts/PlatformLayout';

// Layouts
import UserProfile from '@/components/PlatformProfile';

// Get profile data
export async function getServerSideProps({ query }: any) {
  if (!query.username) {
    return {
      props: {
        user: null
      }
    };
  }

  const user = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/users/${query.username}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then((res) => res.json())
    .then((ret) => {
      return ret?.user;
    });

  if (user) {
    return {
      props: {
        user
      }
    };
  } else {
    return {
      notFound: true
    };
  }
}
export default function UserProfileNS({ user }: any) {
  const { query, push } = useRouter();
  const { currentUser } = useAuthContext();
  let { username } = query as { username: string };

  return (
    <>
      <Head>
        <meta
          property="og:site_name"
          content="Restrafes XCS"
        />
        {user ? (
          <>
            <meta
              property="og:title"
              content={`${user?.displayName || user.name.first}'s Profile`}
            />
            <meta
              property="og:url"
              content={`https://wyre.ryj.my.id/@${username}`}
            />
            <meta
              property="og:description"
              content={`Join ${user?.displayName || user.name.first
                } and a community of architects in managing access points on Restrafes XCS.`}
            />
            <meta
              property="og:image"
              content={user.avatar}
            />
          </>
        ) : (
          <>
            <meta
              property="og:title"
              content={`Your Profile`}
            />
            <meta
              property="og:url"
              content={`https://wyre.ryj.my.id/user`}
            />
            <meta
              property="og:description"
              content={`Join a community of architects in managing access points on Restrafes XCS.`}
            />
          </>
        )}
        <meta
          property="og:type"
          content="website"
        />
      </Head>
      <UserProfile
        username={username}
        user={user}
      />
    </>
  );
}

UserProfileNS.getLayout = (page: any) => <Layout>{page}</Layout>;
