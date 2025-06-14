/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useState } from 'react';

import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuItem, MenuList, Skeleton, Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text, useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { ChevronRightIcon, HamburgerIcon } from '@chakra-ui/icons';

import { IoBusiness } from 'react-icons/io5';
import { MdSensors } from 'react-icons/md';

import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { useAuthContext } from '@/contexts/AuthContext';

import Layout from '@/layouts/PlatformLayout';

import LocationAccessPoints from '@/components/location/LocationAccessPoints';
import LocationInfo from '@/components/location/LocationInfo';

function StyledTab({ children }: { children: React.ReactNode }) {
  return (
    <Tab
      w={'200px'}
      fontSize={['sm', 'md']}
      color={'unset'}
      justifyContent={'left'}
      border={'none'}
      rounded={'lg'}
      fontWeight={'bold'}
      _hover={{
        bg: useColorModeValue('gray.100', 'whiteAlpha.100')
      }}
      _active={{
        bg: useColorModeValue('gray.200', 'whiteAlpha.300'),
        color: useColorModeValue('gray.900', 'white')
      }}
      _selected={{
        bg: useColorModeValue('gray.100', '#E2E8F0'),
        color: useColorModeValue('black', 'gray.900')
      }}
    >
      {children}
    </Tab>
  );
}

export default function PlatformLocation() {
  const router = useRouter();
  const { query, push } = router;
  const { user } = useAuthContext();
  const [location, setLocation] = useState<any>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const toast = useToast();

  let refreshData = useCallback(() => {
    setLocation(null);
    user.getIdToken().then((token: string) => {
      fetch(`/api/v1/locations/${query.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.status === 200) return res.json();
          if (res.status === 404) {
            return push('/404');
          } else if (res.status === 403 || res.status === 401) {
            toast({
              title: 'Unauthorized.',
              description: 'You are not authorized to view this location.',
              status: 'error',
              duration: 5000,
              isClosable: true
            });
            return push('/organizations');
          }
        })
        .then((data) => {
          setLocation(data.location);
        });
    });
  }, [push, query.id, toast, user]);

  // Fetch location data
  useEffect(() => {
    if (!query.id) return;
    if (!user) return;
    if (location) return;
    refreshData();
  }, [query, user, location, refreshData]);

  const indexSwitch = (index: number) => {
    let route = '';
    switch (index) {
      case 0:
        route = `/locations/${query.id}/general`;
        break;
      case 1:
        route = `/locations/${query.id}/access-points`;
        break;
      default:
        route = `/locations/${query.id}/general`;
        break;
    }
    return route;
  };

  useEffect(() => {
    if (!query.tab) return;
    if (query.tab[0] === 'general') setTabIndex(0);
    else if (query.tab[0] === 'access-points') setTabIndex(1);
  }, [query.tab]);

  const onTabChange = (index: number) => {
    push(indexSwitch(index), undefined, { scroll: false });
  };

  return (
    <>
      <Head>
        <title>{location?.name} - Restrafes XCS</title>
        <meta
          property="og:title"
          content="Manage Location - Restrafes XCS"
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
      <Box
        maxW={'full'}
        px={{ base: 4, md: 8 }}
        py={8}
      >
        <Skeleton isLoaded={!!location}>
          <Breadcrumb
            // display={{ base: 'none', md: 'flex' }}
            spacing="8px"
            mb={4}
            separator={<ChevronRightIcon color="gray.500" />}
            fontSize={{ base: 'sm', md: 'md' }}
          >
            <BreadcrumbItem>
              <BreadcrumbLink
                as={NextLink}
                href="/home"
                textUnderlineOffset={4}
              >
                Platform
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink
                as={NextLink}
                href={`/organizations/${location?.organization.id}/settings`}
                textUnderlineOffset={4}
              >
                {location?.organization.name || 'Organization Name'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink
                as={NextLink}
                href={`/locations?organization=${location?.organization.id}`}
                textUnderlineOffset={4}
              >
                Locations
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink
                href="#"
                textUnderlineOffset={4}
              >
                {location?.name || 'Location Name'}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Skeleton>
        <Skeleton isLoaded={!!location}>
          <Text
            as={'h1'}
            fontSize={'4xl'}
            fontWeight={'900'}
            lineHeight={0.9}
            mb={2}
          >
            {location?.name || 'Location Name'}
          </Text>
        </Skeleton>
        <Skeleton isLoaded={!!location}>
          <Text
            fontSize={'lg'}
            color={'gray.500'}
          >
            {location?.organization.name || 'Organization Name'}
          </Text>
        </Skeleton>
        <Box
          display={{ base: 'block', md: 'none' }}
          pt={4}
        >
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<HamburgerIcon />}
              aria-label={'Menu'}
              w={'full'}
            />
            <MenuList>
              <MenuItem
                as={NextLink}
                href={`/locations/${query.id}/general`}
                icon={<IoBusiness />}
              >
                General
              </MenuItem>
              {/* <MenuItem
                as={NextLink}
                href={`/locations/${query.id}/event-logs`}
                icon={<BiSolidTime />}
              >
                Event Logs
              </MenuItem>
              <MenuItem
                as={NextLink}
                href={`/locations/${query.id}/members`}
                icon={<BiSolidGroup />}
              >
                Members
              </MenuItem> */}
              <MenuItem
                as={NextLink}
                href={`/locations/${query.id}/access-points`}
                icon={<MdSensors />}
              >
                Access Points
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
        <Divider my={4} />
        <Tabs
          py={4}
          orientation={'vertical'}
          variant={'line'}
          isLazy={true}
          index={tabIndex}
          onChange={(index) => onTabChange(index)}
          maxW={'full'}
          h={'100%'}
          isManual={true}
        >
          <TabList
            display={{ base: 'none', md: 'block' }}
            h={'100%'}
            border={'none'}
          >
            <StyledTab>
              <IoBusiness />
              <Text ml={2}>General</Text>
            </StyledTab>
            {/* <StyledTab>
              <BiSolidTime />
              <Text ml={2}>Event Logs</Text>
            </StyledTab>
            <StyledTab>
              <BiSolidGroup />
              <Text ml={2}>Members</Text>
            </StyledTab> */}
            <StyledTab>
              <MdSensors />
              <Text ml={2}>Access Points</Text>
            </StyledTab>
          </TabList>

          <TabPanels px={{ base: 0, md: 8 }}>
            <TabPanel p={0}>
              <LocationInfo
                query={query}
                location={location}
                refreshData={refreshData}
              />
            </TabPanel>
            {/* <TabPanel p={0}>
              <LocationEventLogs />
            </TabPanel>
            <TabPanel p={0}>
              <Text>Members</Text>
            </TabPanel> */}
            <TabPanel p={0}>
              <LocationAccessPoints
                location={location}
                refreshData={refreshData}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </>
  );
}

PlatformLocation.getLayout = (page: any) => <Layout>{page}</Layout>;
