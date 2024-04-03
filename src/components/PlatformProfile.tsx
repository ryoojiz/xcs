/* eslint-disable react-hooks/rules-of-hooks */

import { Link } from '@chakra-ui/next-js';
import {
  Avatar,
  AvatarBadge,
  Box,
  Button,
  Container,
  Flex,
  Icon,
  Image,
  Skeleton,
  StackDivider,
  Text,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { BsDiscord } from 'react-icons/bs';
import { IoSettings, IoSparkles } from 'react-icons/io5';
import { SiRoblox } from 'react-icons/si';
import { VscVerifiedFilled } from 'react-icons/vsc';

// Types
import { Achievement, Organization, User } from '@/types';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Authentication
import { useAuthContext } from '@/contexts/AuthContext';
import { BsFillShieldFill } from 'react-icons/bs';
import { IoHammerSharp } from 'react-icons/io5';

function OrganizationItem({ organization }: { organization: any }) {
  return (
    <Link
      href={`/organizations/${organization.id}`}
      w={'auto'}
      h={'auto'}
      transition={'opacity 0.2s ease-out'} _hover={{ opacity: 0.75 }} _active={{ opacity: 0.5 }}
      borderRadius={'md'}
    >
      <Avatar
        name={organization?.name}
        src={organization?.avatar}
        objectFit={'cover'}
        aspectRatio={1 / 1}
        rounded={'md'}
        borderRadius={'md'}
      >
        {organization?.verified && (
          <AvatarBadge boxSize="1.05em">
            <Icon
              as={VscVerifiedFilled}
              color={'gold'}
              h={'1em'}
            />
          </AvatarBadge>
        )}
      </Avatar>
    </Link>
  );
}

export default function Profile({ username, user }: { username: string | null; user: User }) {
  const router = useRouter();
  const { currentUser, user: authUser } = useAuthContext();
  // const [user, setUser] = useState<any | undefined>(undefined);
  const toast = useToast();

  // const fetchUser = useCallback(async (token?: string) => {
  //   fetch(`/api/v1/users/${username}`, {
  //     method: 'GET',
  //     headers: {
  //       Authorization: token ? `Bearer ${token}` : ''
  //     }
  //   })
  //     .then((res) => {
  //       return res.json();
  //     })
  //     .then((res) => {
  //       setUser(res.user);
  //     })
  //     .catch((err) => {
  //       toast({
  //         title: 'User not found',
  //         description: 'Could not find user',
  //         status: 'error',
  //         duration: 5000,
  //         isClosable: true
  //       });
  //     });
  // }, [username, toast]);

  // useEffect(() => {
  //   // if (!currentUser) return;
  //   if (!username) return;
  //   setUser(undefined);
  //   if (authUser) {
  //     authUser.getIdToken().then((token: any) => {
  //       fetchUser(token);
  //     });
  //   } else {
  //     fetchUser();
  //   }
  // }, [username, currentUser, router, toast, authUser, fetchUser]);

  return (
    <>
      <Head>
        {user ? (
          <title>{`${user?.displayName || user?.name?.first}'s Profile`} - Restrafes XCS</title>
        ) : (
          <title>{`Profile - Restrafes XCS`}</title>
        )}
      </Head>
      <Container
        display={'flex'}
        maxW={'full'}
        px={8}
        pt={8}
        flexDir={'column'}
      >
        {/* User Badge */}
        <Box
          pos={'relative'}
          width={{ base: 'full', md: 'min-content' }}
          pb={6}
        >
          {/* Badge */}
          <Flex
            w={'300px'}
            h={'auto'}
            aspectRatio={1 / 1.6}
            rounded={'xl'}
            bg={useColorModeValue('white', 'gray.700')}
            border={'2px solid'}
            borderColor={useColorModeValue('gray.300', 'gray.600')}
            p={8}
            align={'center'}
            flexDir={'column'}
            justify={'space-between'}
            flexGrow={1}
          >
            {/* Punch Hole */}
            <Flex
              h={'24px'}
              w={'24px'}
              px={12}
              rounded={'lg'}
              bg={useColorModeValue('white', 'gray.800')}
              border={'2px solid'}
              borderColor={useColorModeValue('gray.300', 'gray.600')}
              justifySelf={'center'}
            />
            {/* Avatar */}
            <Box
              w={{ base: '75%', md: '75%' }}
              h={'auto'}
              objectFit={'cover'}
              justifySelf={'center'}
              rounded={'lg'}
              overflow={'hidden'}
              border={'2px solid'}
              borderColor={useColorModeValue('gray.300', 'gray.600')}
              background={useColorModeValue('gray.200', 'gray.700')}
              aspectRatio={1 / 1}
            >
              <Skeleton isLoaded={!!user}>
                <Avatar
                  src={user?.avatar}
                  borderRadius={0}
                  w={'100%'}
                  h={'auto'}
                />
              </Skeleton>
            </Box>
            {/* Name */}
            <Box
              mb={user?.platform.staff ? 4 : 8}
              w={'full'}
            >
              <Skeleton isLoaded={!!user} lineHeight={1.25}>
                <Text
                  as={'h1'}
                  fontSize={user?.displayName?.length > 16 ? '2xl' : '3xl'}
                  fontWeight={'bold'}
                  textAlign={'center'}
                >
                  {user?.displayName}
                </Text>
              </Skeleton>
              <Skeleton isLoaded={!!user}>
                <Flex
                  flexDir={'column'}
                  align={'center'}
                  justify={'center'}
                >
                  <Text
                    as={'h2'}
                    size={'md'}
                    textAlign={'center'}
                  >
                    @{user?.username || 'useame'}
                  </Text>
                  {user?.platform.staff && (
                    <Flex align={'center'}>
                      <Icon
                        as={IoHammerSharp}
                        mr={1}
                      />
                      <Text
                        fontWeight={'bold'}
                        textAlign={'center'}
                        zIndex={1}
                      >
                        {user?.platform.staffTitle || 'Employee'}
                      </Text>
                    </Flex>
                  )}
                </Flex>
              </Skeleton>
            </Box>
          </Flex>
        </Box>
        {
          currentUser?.id === user?.id && (
            <Button as={Link} colorScheme={'black'} href={'/settings/profile'} w={{ base: '300px', md: '300px' }} mb={4}>
              <Icon
                as={IoSettings}
                mr={2}
              />
              <Text
                size={'md'}
                fontWeight={'bold'}
              >
                Edit Profile
              </Text>
            </Button>
          )
        }
        <VStack maxW={'sm'} align={'flex-start'} my={2} mb={8} spacing={4} divider={<StackDivider borderColor={useColorModeValue("gray.200", "gray.700")} />}>
          {/* User Bio */}
          <Box
            w={{ base: 'full', md: '384px' }}
            rounded={'lg'}
            mb={2}
          >
            <Text
              as={'h1'}
              fontSize={'xl'}
              fontWeight={'bold'}
            >
              About Me
            </Text>
            <Skeleton isLoaded={!!user}>
              {!user?.bio ? (
                <Text
                  size={'md'}
                  variant={'subtext'}
                >
                  This user has not set a bio yet.
                </Text>
              ) : (
                // multi-line support
                user?.bio.split('\n').map((line: string, i: number) => (
                  <Text
                    size={'md'}
                    key={i}
                  >
                    {line}
                  </Text>
                ))
              )}
            </Skeleton>
          </Box>
          {/* Achievements */}
          {
            Object.keys(user?.achievements || {})!?.length > 0 && (
              <Box
                w={{ base: 'full', md: '320px' }}
                mr={{ base: 0, md: 16 }}
                pb={2}
              >
                <Text
                  as={'h1'}
                  fontSize={'xl'}
                  fontWeight={'bold'}
                >
                  Achievements
                </Text>
                <Flex
                  w={'full'}
                  h={'fit-content'}
                  flexDir={'column'}
                  align={'flex-start'}
                  justify={'flex-start'}
                  flexGrow={1}
                >
                  <Skeleton isLoaded={!!user}>
                    {Object.keys(user?.achievements || {})?.length ? (
                      <Wrap spacing={2} py={2}>
                        {(Object.values(user?.achievements || {}) || [])?.map((a: Achievement) => (
                          <Tooltip key={a.id} label={
                            <Flex p={2} gap={4} align={'center'}>
                              <Image src={a.icon} alt={a.name} width={"64px"} height={"64px"} objectFit={'cover'} borderRadius={'lg'} />
                              <Flex flexDir={'column'} mr={4}>
                                <Text fontWeight={'bold'} fontSize={'lg'}>{a.name}</Text>
                                <Text fontWeight={'normal'}>{a.description}</Text>
                                <Text>
                                  Unlocked on {new Date(a.earnedAt || 0).toLocaleDateString('en-US', {})}
                                </Text>
                              </Flex>
                            </Flex>
                          }>
                            <Image src={a.icon} alt={a.name} width={"64px"} height={"64px"} objectFit={'cover'} borderRadius={'lg'} cursor={'help'} border={'1px'} />
                          </Tooltip>
                        ))}
                      </Wrap>
                    ) : (
                      <Text
                        size={'md'}
                        variant={'subtext'}
                      >
                        This user has no achievements.
                      </Text>
                    )}
                  </Skeleton>
                </Flex>
              </Box>
            )
          }
          {/* Organizations */}
          <Box
            w={{ base: 'full', md: '320px' }}
            mr={{ base: 0, md: 16 }}
            pb={2}
          >
            <Text
              as={'h1'}
              fontSize={'xl'}
              fontWeight={'bold'}
            >
              Organizations
            </Text>
            <Flex
              w={'full'}
              h={'fit-content'}
              flexDir={'column'}
              align={'flex-start'}
              justify={'flex-start'}
              flexGrow={1}
            >
              <Skeleton isLoaded={!!user}>
                {user?.organizations?.length ? (
                  <Wrap spacing={2} py={2}>
                    {user?.organizations?.map((org: Organization) => (
                      <Tooltip key={org.id} label={org.name}>
                        <WrapItem>
                          <OrganizationItem
                            organization={org}
                          />
                        </WrapItem>
                      </Tooltip>
                    ))}
                  </Wrap>
                ) : (
                  <Text
                    size={'md'}
                    variant={'subtext'}
                  >
                    This user is not in any organizations.
                  </Text>
                )}
              </Skeleton>
            </Flex>
          </Box>
          {/* User Linked Accounts */}
          <Box>
            <Box
              rounded={'lg'}
              w={{ base: 'full', md: '384px' }}
              pb={2}
            >
              <Text
                as={'h1'}
                fontSize={'xl'}
                fontWeight={'bold'}
              >
                Linked Accounts
              </Text>
              <Skeleton isLoaded={!!user}>
                <Wrap
                  flexDir={'row'}
                  w={'fit-content'}
                >
                  {!user?.discord.verified && !user?.roblox.verified && (
                    <Text
                      size={'md'}
                      variant={'subtext'}
                    >
                      This user has not linked any accounts.
                    </Text>
                  )}
                  {user?.discord.verified && (
                    <Tooltip label={`${user?.discord.username}${user?.discord.discriminator ? `#${user?.discord.discriminator}` : ''
                      }`}>
                      <WrapItem>
                        <Button
                          as={Link}
                          href={`https://discord.com/users/${user?.discord.id}`}
                          target="_blank"
                          size={'sm'}
                          variant={'ghost'}
                          style={{ textDecoration: 'none' }}
                        >
                          <Icon
                            as={BsDiscord}
                            size={'xl'}
                            mr={2}
                          />
                          <Text
                            size={'md'}
                            fontWeight={'bold'}
                          >
                            {user?.discord.username}
                            {user?.discord.discriminator ? `#${user?.discord.discriminator}` : ''}
                          </Text>
                        </Button>
                      </WrapItem>
                    </Tooltip>
                  )}
                  {user?.roblox.verified && (
                    <Tooltip label={user?.roblox.username}>
                      <WrapItem>
                        <Button
                          as={Link}
                          href={`https://roblox.com/users/${user?.roblox.id}/profile`}
                          target="_blank"
                          size={'sm'}
                          variant={'ghost'}
                          style={{ textDecoration: 'none' }}
                        >
                          <Icon
                            as={SiRoblox}
                            size={'xl'}
                            mr={2}
                          />
                          <Text
                            size={'md'}
                            fontWeight={'bold'}
                          >
                            {user?.roblox.username}
                          </Text>
                        </Button>
                      </WrapItem>
                    </Tooltip>
                  )}
                </Wrap>
              </Skeleton>
            </Box>
          </Box>
        </VStack>
      </Container>
    </>
  );
}
