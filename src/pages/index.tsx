import Head from 'next/head';

import Home from '@/components/Home';
import Layout from '@/layouts/PublicLayout';

import { getSortedPostsData } from '@/lib/posts';

export async function getStaticProps() {
  const allPostsData = await getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
}

export default function Homepage({ allPostsData }: { allPostsData: any }) {
  return (
    <>
      <Head>
        <title>Home - Restrafes XCS</title>
        <meta
          property="og:title"
          content="Home - Restrafes XCS"
        />
        <meta
          property="og:site_name"
          content="Restrafes XCS"
        />
        <meta
          property="og:url"
          content="https://xcs.restrafes.co"
        />
        <meta
          property="og:description"
          content="Control your access points with ease."
        />
        <meta
          property="og:type"
          content="website"
        />
        <meta
          property="og:image"
          content="/images/logo-square.jpg"
        />
      </Head>
      <Home allPostsData={allPostsData} />
    </>
  );
}

Homepage.getLayout = (page: any) => <Layout>{page}</Layout>;
