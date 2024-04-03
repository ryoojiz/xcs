// Components
import { useEffect, useState } from 'react';

import {
  Box,
  Container,
  Divider,
  Heading,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { HamburgerIcon } from '@chakra-ui/icons';

import { BiSolidUserDetail } from 'react-icons/bi';
import { FaPaintBrush } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import { RiAdminFill, RiMailAddFill } from 'react-icons/ri';

import Head from 'next/head';
import { useRouter } from 'next/router';

// Authentication
import { useAuthContext } from '@/contexts/AuthContext';

// Layouts
import Layout from '@/layouts/PlatformLayout';

import SettingsAdmin from '@/components/settings/SettingsAdmin';
import SettingsAppearance from '@/components/settings/SettingsAppearance';
import SettingsInvite from '@/components/settings/SettingsInvite';
import SettingsLinkedAccounts from '@/components/settings/SettingsLinkedAccounts';
import SettingsProfile from '@/components/settings/SettingsProfile';

function StyledTab({
  children,
  index,
  icon,
  demoAllowed = true
}: {
  children: React.ReactNode;
  index: number;
  icon?: any;
  demoAllowed?: boolean;
}) {
  const { currentUser } = useAuthContext();
  const { push } = useRouter();

  // if (!demoAllowed && currentUser?.platform?.demo) return null;

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
      onClick={() => {
        push(
          `/settings/${
            index === 0
              ? 'profile'
              : index === 1
              ? 'appearance'
              : index === 2
              ? 'linked-accounts'
              : index === 3
              ? 'referrals'
              : 'staff-settings'
          }`
        );
      }}
    >
      {icon ? (
        <Icon
          as={icon}
          mr={2}
        />
      ) : null}
      {children}
    </Tab>
  );
}

export default function Settings() {
  const { query, push } = useRouter();
  const toast = useToast();
  const { currentUser, user } = useAuthContext();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!query.section) return;
    let section;
    switch (query.section[0]) {
      case 'profile':
        section = 0;
        break;
      case 'appearance':
        section = 1;
        break;
      case 'linked-accounts':
        section = 2;
        break;
      case 'referrals':
        section = 3;
        break;
      case 'staff-settings':
        section = 4;
        break;
      default:
        section = 0;
    }
    setIndex(section);
  }, [query]);

  useEffect(() => {
    // discord linked
    if (query.discordLinked !== undefined) {
      if (query.discordLinked === 'true') {
        toast({
          title: 'Successfully linked your Discord account.',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        toast({
          title: 'There was an error linking your Discord account.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    }
    // roblox linked
    if (query.robloxLinked !== undefined) {
      if (query.robloxLinked === 'true') {
        toast({
          title: 'Successfully linked your Roblox account.',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        toast({
          title: 'There was an error linking your Roblox account.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    }
  }, [query, toast]);

  return (
    <>
      <Head>
        <title>Settings - Restrafes XCS</title>
        <meta
          property="og:title"
          content="Settings - Restrafes XCS"
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
      <Container
        maxW={'full'}
        p={8}
      >
        <Heading>Settings</Heading>
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
                onClick={() => {
                  setIndex(0);
                }}
              >
                Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setIndex(1);
                }}
              >
                Appearance
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setIndex(2);
                }}
              >
                Linked Accounts
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setIndex(3);
                }}
              >
                Referrals
              </MenuItem>
              {currentUser?.platform.staff && (
                <MenuItem
                  onClick={() => {
                    setIndex(4);
                  }}
                >
                  Staff Settings
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </Box>
        <Tabs
          py={4}
          orientation={'vertical'}
          variant={'line'}
          isLazy={true}
          maxW={'full'}
          h={'100%'}
          index={index}
          onChange={setIndex}
          isManual={true}
        >
          <TabList
            display={{ base: 'none', md: 'block' }}
            h={'100%'}
            border={'none'}
          >
            <StyledTab
              index={0}
              demoAllowed={false}
              icon={BiSolidUserDetail}
            >
              <Text>Profile</Text>
            </StyledTab>
            <StyledTab
              index={1}
              icon={FaPaintBrush}
            >
              <Text>Appearance</Text>
            </StyledTab>
            <StyledTab
              index={2}
              icon={FiExternalLink}
            >
              <Text>Linked Accounts</Text>
            </StyledTab>
            <StyledTab
              index={3}
              icon={RiMailAddFill}
            >
              <Text>Referrals</Text>
            </StyledTab>
            {currentUser?.platform.staff && (
              <StyledTab
                index={4}
                icon={RiAdminFill}
              >
                <Text>Staff Settings</Text>
              </StyledTab>
            )}
          </TabList>

          <TabPanels px={{ base: 0, md: 8 }}>
            <TabPanel p={0}>
              <Heading>Profile</Heading>
              <Text
                fontSize={'md'}
                color={'gray.500'}
              >
                This is how you appear to other users.
              </Text>
              <Divider
                mt={4}
                mb={8}
              />
              <SettingsProfile />
            </TabPanel>
            <TabPanel p={0}>
              <Heading>Appearance</Heading>
              <Text
                fontSize={'md'}
                color={'gray.500'}
              >
                Customize the appearance of the website.
              </Text>
              <Divider
                mt={4}
                mb={8}
              />
              <SettingsAppearance />
            </TabPanel>
            <TabPanel p={0}>
              <Heading>Linked Accounts</Heading>
              <Text
                fontSize={'md'}
                color={'gray.500'}
              >
                Link your accounts to verify your identity.
              </Text>
              <Divider
                mt={4}
                mb={8}
              />
              <SettingsLinkedAccounts />
            </TabPanel>
            <TabPanel p={0}>
              <Heading>Referrals</Heading>
              <Text
                fontSize={'md'}
                color={'gray.500'}
              >
                Sponsor users to the platform.
              </Text>
              <Divider
                mt={4}
                mb={8}
              />
              <SettingsInvite />
            </TabPanel>
            <TabPanel p={0}>
              <Heading>Staff Settings</Heading>
              <Text
                fontSize={'md'}
                color={'gray.500'}
              >
                Super secret settings.
              </Text>
              <Divider
                mt={4}
                mb={8}
              />
              <SettingsAdmin />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </>
  );
}

Settings.getLayout = (page: any) => <Layout>{page}</Layout>;
