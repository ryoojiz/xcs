import { getSortedPostsData } from '@/lib/posts';
import { useEffect, useState } from 'react';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Icon,
  Image,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
  useColorModeValue
} from '@chakra-ui/react';

import { Link } from '@chakra-ui/next-js';

import Head from 'next/head';

import { useAuthContext } from '@/contexts/AuthContext';

import StatBox from '@/components/StatBox';
import Layout from '@/layouts/PlatformLayout';
import moment from 'moment';
import { BsArrowUpRight } from 'react-icons/bs';

const randomSubGreetings = [
  'Securing your facility starts here.',
  'Building trust through access.',
  'Managing access with ease.',
  'Security made simple.',
  'Where security meets flexibility.',
  'Take control of your entry points.',
  'Intelligent access management.',
  'Making security seamless.'
];

function NavLink({
  href,
  variant = 'ghost',
  pathname,
  disabled,
  children
}: {
  href: string;
  variant?: string;
  pathname: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      as={Link}
      isDisabled={disabled}
      // variant={pathname === href ? 'solid' : variant}
      variant={'unstyled'}
      border={'1px solid'}
      borderColor={useColorModeValue('blackAlpha.900', 'white')}
      borderRadius={'none'}
      py={2}
      px={4}
      href={href}
      transition={'all 0.2s ease'}
      _hover={{
        bg: useColorModeValue('blackAlpha.900', 'white'),
        color: useColorModeValue('white', 'black')
      }}
      _active={{
        bg: useColorModeValue('blackAlpha.700', 'whiteAlpha.700'),
        color: useColorModeValue('white', 'black')
      }}
      lineHeight={1.25}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}

export async function getStaticProps() {
  const posts = await getSortedPostsData();
  return {
    props: {
      posts
    }
  };
}
export default function PlatformHome({ posts }: any) {
  const { currentUser, user } = useAuthContext();
  const [stats, setStats] = useState({ total: 0, granted: 0, denied: 0 });
  const [randomSubGreeting, setRandomSubGreeting] = useState('');

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token: string) => {
      fetch('/api/v1/statistics/total-scans', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
        });
    });
  }, [user]);

  useEffect(() => {
    setRandomSubGreeting(randomSubGreetings[Math.floor(Math.random() * randomSubGreetings.length)]);
  }, []);

  return (
    <>
      <Head>
        <title>Home - Amperra Wyre</title>
        <meta
          property="og:title"
          content="Platform Home - Amperra Wyre"
        />
        <meta
          property="og:site_name"
          content="Amperra Wyre"
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
      <Box
        maxW={'container.xl'}
        p={8}
      >
        <Flex
          flexDir={'column'}
          gap={4}
        >
          {/* Greeting */}
          <Box id={'greeting'}>
            <Stack
              direction={{ base: 'column', md: 'row' }}
              gap={8}
              align={'center'}
              justify={{
                base: 'center',
                md: 'flex-start'
              }}
            >
              <Skeleton
                isLoaded={!!currentUser}
                rounded={'full'}
              >
                <Link href={`/@${currentUser?.username}`}>
                  <Avatar
                    size={'2xl'}
                    src={currentUser?.avatar || ''}
                  />
                </Link>
              </Skeleton>
              <Skeleton isLoaded={!!currentUser}>
                <Flex
                  flexDir={'column'}
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  <Heading fontSize={'3xl'}>
                    Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
                    {currentUser?.displayName || currentUser?.username || 'Username'}.
                  </Heading>
                  <Text
                    fontSize={'xl'}
                    color={'gray.500'}
                  >
                    {randomSubGreeting || 'Subgreeting'}
                  </Text>
                </Flex>
              </Skeleton>
            </Stack>
          </Box>
          <Flex
            py={4}
            gap={4}
            flexDir={'column'}
          >
            {currentUser?.platform?.demo ? (
              <Box
                rounded={'lg'}
                px={6}
                py={4}
                bg={'black'}
                color={'white'}
              >
                <Flex flexDir={'column'}>
                  <Text
                    fontSize={'lg'}
                    fontWeight={'bold'}
                  >
                    This is a demo account
                  </Text>
                  <Text>You are currently logged into a demo account. Do not use this account for personal use.</Text>
                </Flex>
              </Box>
            ) : (
              <Box
                rounded={'lg'}
                px={6}
                py={4}
                bg={'black'}
                color={'white'}
              >
                <Flex flexDir={'column'}>
                  <Text
                    fontSize={'lg'}
                    fontWeight={'bold'}
                  >
                    We value your feedback
                  </Text>
                  <Text>
                    R&C XCS is still in development and we&apos;re looking for feedback from our current users so that
                    we can improve our product.
                  </Text>
                  <Text>
                    Please take a moment to fill out our{' '}
                    <Link
                      target="_blank"
                      href={'https://tally.so/r/nrOB5L'}
                      textDecor={'underline'}
                    >
                      feedback form
                    </Link>
                    .
                  </Text>
                </Flex>
              </Box>
            )}
          </Flex>
          <Divider />
          {/* Global Stats */}
          <Flex
            pt={2}
            gap={8}
            flexDir={'column'}
          >
            <Box>
              <Flex
                flexDir={'column'}
                mb={4}
              >
                <Heading fontSize={'2xl'}>Statistics</Heading>
                <Text variant={'subtext'}>Data from across the platform.</Text>
              </Flex>
              <Box
                display={'grid'}
                gridTemplateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }}
                flexDir={{ base: 'column', md: 'row' }}
                gap={4}
              >
                <Skeleton isLoaded={!!stats.total}>
                  <StatBox
                    label={'Total Scans'}
                    value={`${stats.total} scans`}
                    helper={'Since the beginning of time.'}
                  />
                </Skeleton>
                <Skeleton isLoaded={!!stats.granted}>
                  <StatBox
                    label={'Successful Scans'}
                    value={`${stats.granted} scan${stats.granted > 1 ? 's' : ''} (${Math.round(
                      (stats.granted / stats.total) * 100
                    )}%)`}
                    helper={'Scans that were successful.'}
                  />
                </Skeleton>
                <Skeleton isLoaded={!!stats.denied}>
                  <StatBox
                    label={'Failed Scans'}
                    value={`${stats.denied} scan${stats.denied > 1 ? 's' : ''} (${Math.round(
                      (stats.denied / stats.total) * 100
                    )}%)`}
                    helper={'Scans that were denied.'}
                  />
                </Skeleton>
              </Box>
            </Box>
            {/* Platform Announcements */}
            <Box>
              <Flex
                flexDir={'row'}
                align={'center'}
                mb={4}
              >
                <Flex flexDir={'column'}>
                  <Heading fontSize={'2xl'}>Announcements</Heading>
                  <Text variant={'subtext'}>Stay up to date with the latest news.</Text>
                </Flex>
                <Spacer />
                <NavLink
                  href={'/blog'}
                  pathname={'/blog'}
                >
                  View All
                  <Icon
                    as={BsArrowUpRight}
                    ml={1}
                    h={3}
                  />
                </NavLink>
              </Flex>
              <Skeleton isLoaded={!!currentUser}>
                <Stack
                  direction={{ base: 'column', md: 'row' }}
                  spacing={4}
                  align={'center'}
                >
                  {/* max 3 blog posts */}
                  {posts.slice(0, 3).map((post: any) => (
                    <Link
                      href={`/blog/${post.id}`}
                      textDecor={'none !important'}
                      key={post.id}
                    >
                      <Flex
                        flexDir={'column'}
                        gap={4}
                        w={'340px'}
                      >
                        <Image
                          src={post.thumbnail}
                          alt={post.thumbnailAlt}
                          objectFit={'cover'}
                          aspectRatio={1.5 / 1}
                          borderRadius={'lg'}
                        />
                        <Flex flexDir={'column'}>
                          <Heading size={'md'}>{post.title}</Heading>
                          <Text>{moment(post.date).format('MMMM Do, YYYY')}</Text>
                          <Tag
                            mt={2}
                            w={'fit-content'}
                          >
                            {post.category}
                          </Tag>
                        </Flex>
                      </Flex>
                    </Link>
                  ))}
                </Stack>
              </Skeleton>
            </Box>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}

PlatformHome.getLayout = (page: any) => <Layout>{page}</Layout>;
