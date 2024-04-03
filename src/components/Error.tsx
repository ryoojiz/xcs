import { Link } from '@chakra-ui/next-js';
import { Box, Button, Container, Flex, Heading, Text } from '@chakra-ui/react';
import Head from 'next/head';
import { useMemo } from 'react';

export default function Error({ statusCode }: { statusCode: string }) {
  const ErrorPageMessages = {
    "404": {
      title: 'Page Not Found',
      message: 'The page you are looking for does not exist.',
    },
    "403": {
      title: 'Unauthorized',
      message: 'You do not have permission to view this page.',
    },
    "401": {
      title: 'Unauthorized',
      message: 'You do not have permission to view this page.',
    },
    "500": {
      title: 'Server Error',
      message: 'An error occurred on the server.',
    },
  } as { [key: string]: ErrorPageMessage };

  interface ErrorPageMessage {
    title: string;
    message: string;
  }

  const { title, message }: ErrorPageMessage = useMemo(() => {
    return ErrorPageMessages[statusCode] || ErrorPageMessages['500'];
  }, [statusCode]);

  return (
    <>
      <Head>
        <title>{title} - Restrafes XCS</title>
      </Head>
      <Container
        maxW={'container.sm'}
        py={16}
      >
        <Text
          as={'h1'}
          fontSize={'4xl'}
          fontWeight={'900'}
        >
          {title}
        </Text>
        <Text
          fontSize={'lg'}
          mb={4}
        >
          {message}
        </Text>
        <Flex flexDir={'row'} gap={2}>
          <Button as={Link} href={'/'} _hover={{ textDecoration: 'none' }}>Return to Home</Button>
          <Button as={Link} href={'/home'} _hover={{ textDecoration: 'none' }}>Return to Platform Home</Button>
        </Flex>
      </Container>
    </>
  );
}
