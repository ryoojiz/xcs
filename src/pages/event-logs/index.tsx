import { Container, Text } from '@chakra-ui/react';

import Head from 'next/head';

import Layout from '@/layouts/PlatformLayout';

export default function PlatformEventLogs() {
  return (
    <>
      <Head>
        <title>Event Logs - Restrafes XCS</title>
        <meta
          property="og:title"
          content="Event Logs - Restrafes XCS"
        />
        <meta
          property="og:site_name"
          content="Restrafes XCS"
        />
        <meta
          property="og:url"
          content="https://wyre.ryj.my.id"
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
      <Container
        maxW={'full'}
        p={8}
      >
        <Text
          fontSize={'4xl'}
          fontWeight={'900'}
        >
          Event Logs
        </Text>
        <Text
          fontSize={'xl'}
          color={'gray.500'}
        >
          This feature is coming soon. Please check back later.
        </Text>
      </Container>
    </>
  );
}

PlatformEventLogs.getLayout = (page: any) => <Layout>{page}</Layout>;
