/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState } from 'react';

import {
  Avatar,
  Box,
  Button,
  Container,
  Flex,
  Icon,
  Image,
  Skeleton,
  Text,
  chakra,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { Link } from '@chakra-ui/next-js';

import { useAuthContext } from '@/contexts/AuthContext';
import { Invitation } from '@/types';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiArrowRight } from 'react-icons/fi';

export default function Invitation({ invite, errorMessage }: { invite: Invitation, errorMessage: string | null }) {
  const { query, push } = useRouter();
  const toast = useToast();
  const [isAcceptLoading, setIsAcceptLoading] = useState<boolean>(false);
  const { user, currentUser } = useAuthContext();
  const [loading, setLoading] = useState<boolean>(true);

  let { id: queryId } = query;
  const id = queryId?.length ? queryId[0] : null;

  useEffect(() => {
    setLoading(false);
  }, [user]);

  const acceptInvite = async () => {
    setIsAcceptLoading(true);
    if (invite.type === 'organization') {
      push(`/organizations/?invitation=${query.id}`);
    } else if (invite.type === 'xcs') {
      push(`/auth/activate/${query.id}`);
    }
  };

  const inviteTypeSwitch = (type: string) => {
    switch (type) {
      case 'organization':
        return 'join their organization';
      case 'xcs':
        return 'create an account.';
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Invitation - Restrafes XCS</title>
      </Head>
      <Container
        maxW={'container.lg'}
        h={'100dvh'}
      >
        <Flex
          pos={'relative'}
          flexDir={'column'}
          align={'center'}
          justify={'center'}
          h={'full'}
          bottom={[0, 8]}
        >
          <Link
            my={8}
            href={'/'}
          >
            <Image
              src={useColorModeValue('/images/logo-black.png', '/images/logo-white.png')}
              alt={'Restrafes XCS Logo'}
              w={'auto'}
              h={'24px'}
              objectFit={'contain'}
              transition={'filter 0.2s ease'}
              _hover={{
                filter: useColorModeValue('opacity(0.75)', 'brightness(0.75)')
              }}
              _active={{
                filter: useColorModeValue('opacity(0.5)', 'brightness(0.5)')
              }}
            />
          </Link>

          <Flex
            maxW={['100%', 'lg']}
            // aspectRatio={invite ? 1 / 1.25 : 'unset'}
            minH={invite ? 'xl' : 'unset'}
            rounded={'lg'}
            border={['none', '1px solid']}
            borderColor={['none', useColorModeValue('gray.300', 'gray.600')]}
            direction={'column'}
            align={'center'}
            justify={'space-between'}
            p={[4, 8]}
          >
            <Box w={'full'}>
              <Skeleton isLoaded={!loading}>
                <Text
                  as={'h2'}
                  fontSize={{ base: '2xl', sm: '3xl' }}
                  fontWeight={'900'}
                  letterSpacing={'tight'}
                  w={'full'}
                  textAlign={'center'}
                >
                  {invite
                    ? invite.type === 'organization'
                      ? "You've recieved an invitation"
                      : "You're invited to register"
                    : 'Invitation not found'}
                </Text>
              </Skeleton>
              <Skeleton isLoaded={!loading}>
                <Text
                  fontSize={'lg'}
                  mb={2}
                  textAlign={'center'}
                >
                  {invite ? (
                    <>
                      {invite?.creator?.displayName || invite?.creator?.name?.first} has invited you to{' '}
                      {inviteTypeSwitch(invite?.type)}
                      {invite?.type === 'organization' ? (
                        <Text
                          as={'span'}
                          fontWeight={'bold'}
                        >
                          {', '}
                          {invite.organization?.name}
                        </Text>
                      ) : null}
                    </>
                  ) : (
                    <>{!errorMessage ? "The invitation you are looking for is either invalid or no longer exists." : errorMessage}</>
                  )}
                </Text>
              </Skeleton>
            </Box>
            {invite ? (
              <>
                <Flex
                  flexDir={'row'}
                  align={'center'}
                  justify={'center'}
                  flexGrow={1}
                  w={'full'}
                  p={4}
                >
                  <Skeleton
                    display={'flex'}
                    isLoaded={!loading}
                    objectFit={'contain'}
                    justifyContent={'center'}
                    rounded={'full'}
                  >
                    <Avatar
                      src={invite?.creator?.avatar || '/images/default-avatar.png'}
                      size={'full'}
                      maxW={'240px'}
                      aspectRatio={1 / 1}
                      outline={'1px solid'}
                      outlineColor={useColorModeValue('gray.300', 'gray.600')}
                    />
                  </Skeleton>
                  {
                    invite.type === 'organization' && (
                      <>
                        <Icon as={FiArrowRight} fontSize={'3xl'} mx={4} />
                        <Skeleton
                          display={'flex'}
                          isLoaded={!loading}
                          objectFit={'contain'}
                          justifyContent={'center'}
                          rounded={'full'}
                        >
                          <Avatar
                            src={invite?.organization?.avatar || '/images/default-avatar-organization.png'}
                            size={'full'}
                            maxW={'240px'}
                            aspectRatio={1 / 1}
                            outline={'1px solid'}
                            outlineColor={useColorModeValue('gray.300', 'gray.600')}
                            borderRadius={'lg'}
                          />
                        </Skeleton>
                      </>
                    )
                  }
                </Flex>
                <Box w={'full'}>
                  <Skeleton isLoaded={!loading}>
                    {currentUser || invite.type === 'xcs' ? (
                      <Button
                        w={'full'}
                        my={2}
                        isLoading={isAcceptLoading}
                        onClick={acceptInvite}
                        isDisabled={invite?.type === 'xcs' && currentUser}
                      >
                        {invite?.type === 'xcs'
                          ? currentUser
                            ? 'You are logged in'
                            : 'Register & accept'
                          : 'Accept invitation'}
                      </Button>
                    ) : (
                      <Button
                        w={'full'}
                        my={2}
                        isLoading={isAcceptLoading}
                        onClick={() => {
                          setIsAcceptLoading(true);
                          push('/login?redirect=/invitation/' + query.id);
                        }}
                      >
                        Login to accept
                      </Button>
                    )}
                  </Skeleton>
                  <Skeleton isLoaded={!loading}>
                    <Text
                      fontSize={'sm'}
                      my={2}
                      textAlign={'center'}
                    >
                      By accepting this invitation, you agree to the{' '}
                      <chakra.div as={'span'} whiteSpace={'nowrap'}>
                        <Text
                          as={'span'}
                          fontWeight={'bold'}
                        >
                          Restrafes XCS
                        </Text>{' '}
                        <Text
                          as={'span'}
                          fontWeight={'bold'}
                          whiteSpace={'nowrap'}
                        >
                          <Link
                            href={'/legal/terms'}
                            textDecor={'underline'}
                            textUnderlineOffset={4}
                          >
                            Terms of Use
                          </Link>
                        </Text>{' '}
                        and{' '}
                        <Text
                          as={'span'}
                          fontWeight={'bold'}
                          whiteSpace={'nowrap'}
                        >
                          <Link
                            href={'/legal/privacy'}
                            textDecor={'underline'}
                            textUnderlineOffset={4}
                          >
                            Privacy Policy
                          </Link>
                          .
                        </Text>
                      </chakra.div>
                    </Text>
                  </Skeleton>
                </Box>
              </>
            ) : (
              <>
                <Box w={'full'}>
                  <Button
                    as={Link}
                    href={'/'}
                    w={'full'}
                    mt={4}
                  >
                    Return to Home
                  </Button>
                </Box>
              </>
            )}
          </Flex>
        </Flex>
      </Container>
    </>
  );
}
