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
        <title>Home - Amperra Wyre</title>
        <meta
          property="og:title"
          content="Home - Wyre Management"
        />
        <meta
          property="og:site_name"
          content="Wyre Management"
        />
        <meta
          property="og:url"
          content="https://wyre.ryj.my.id"
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
