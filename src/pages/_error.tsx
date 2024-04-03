// Components
import { Box, Flex } from '@chakra-ui/react';
import { NextPageContext } from 'next';

import Error from '@/components/Error';
import Footer from '@/components/Footer';
import Nav from '@/components/nav/Nav';

function ErrorPage({ statusCode }: { statusCode: string }) {
  return (
    <Box
      w={'100vw'}
      flexDir={'row'}
    >
      <Nav />
      <Box width={'full'}>
        <Box
          as="main"
          minH={'calc(100vh - 6rem)'}
        >
          <Error statusCode={statusCode} />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
}

export default ErrorPage;