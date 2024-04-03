/* eslint-disable react-hooks/rules-of-hooks */
import { Divider, Flex, Icon, Link, Text, useColorModeValue } from '@chakra-ui/react';

import NextLink from 'next/link';
import { BiGitBranch } from 'react-icons/bi';

export default function Footer({ type = 'platform' }: { type?: 'public' | 'platform' }) {
  return (
    <>
      <Flex
        as="footer"
        position={'sticky'}
        top={0}
        flexDir={'column'}
        w={'100%'}
        h={'8rem'}
        border={'1px solid'}
        borderLeft={{ base: '1px solid', md: 'unset' }}
        borderColor={useColorModeValue('gray.300', 'gray.700')}
        // borderColor={type === 'public' ? useColorModeValue('blackAlpha.900', 'whiteAlpha.900') : useColorModeValue('gray.300', 'gray.700')}
        p={4}
        align={'center'}
        justify={'center'}
      >
        <Text>
          <Text
            as={'span'}
            fontWeight={'bold'}
            letterSpacing={'tight'}
          >
            © RESTRAFES & CO LLC.
          </Text>{' '}
          All rights reserved.
        </Text>
        <Flex align={'center'} justify={'center'} fontSize={'sm'}>
          <Link
            as={NextLink}
            href={'/legal/terms'}
          >
            Terms of Use
          </Link>
          <Divider
            orientation={'vertical'}
            mx={2}
            h={'1rem'}
            borderColor={useColorModeValue('gray.300', 'gray.700')}
          />
          <Link
            as={NextLink}
            href={'/legal/privacy'}
          >
            Privacy Policy
          </Link>
        </Flex>
        <Flex
          color={'gray.500'}
          fontSize={"sm"}
          align={'center'}
        >
          <Icon as={BiGitBranch} mr={1} />{" "}
          <Text as={'span'}>
            {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev-mode'}{" "}
            ({process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || 'dev'})
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
