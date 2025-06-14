/* eslint-disable react-hooks/rules-of-hooks */
import { Key, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  FormControl,
  Heading,
  Icon,
  IconButton,
  Input,
  Skeleton,
  Spacer,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react';

import { Link } from '@chakra-ui/next-js';
import { MdOutlineAddCircle } from 'react-icons/md';

import { Select } from 'chakra-react-select';
import moment from 'moment';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuthContext } from '@/contexts/AuthContext';

import Layout from '@/layouts/PlatformLayout';

import CreateLocationDialog from '@/components/CreateLocationDialog';
import { Location, Organization } from '@/types';
import { AiFillSetting } from 'react-icons/ai';
import { BiGrid, BiRefresh } from 'react-icons/bi';
import { BsListUl } from 'react-icons/bs';

const toRelativeTime = (date: string) => {
  return moment(new Date(date)).fromNow();
}
const toActualTime = (date: string) => {
  return moment(new Date(date)).format('MMMM Do YYYY, h:mm:ss a');
}

function GridEntry({ key, location }: { key: Key, location?: Location }) {
  return <>
    <Tooltip label={location?.name} placement={'top'} key={location?.id}>
      <Flex key={location?.id} flexDir={'column'} w={{ base: '45%', md: '128px', lg: '224px' }}>
        {/* icon */}
        <Skeleton isLoaded={!!location}>
          <Flex
            border={'1px solid'}
            borderRadius={'lg'}
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            aspectRatio={1}
          >
            <Link href={`/locations/${location?.id}/general`}>
              <Avatar
                ignoreFallback={true}
                borderRadius={'lg'}
                size={'lg'}
                src={location?.roblox?.place?.thumbnail || '/images/default-avatar-location.png'}
                cursor={'pointer'}
                w={'full'}
                h={'full'}
                transition={'opacity 0.2s ease-out'} _hover={{ opacity: 0.75 }} _active={{ opacity: 0.5 }}
              />
            </Link>
          </Flex>
        </Skeleton>
        {/* text */}
        <Skeleton isLoaded={!!location} my={4} px={2}>
          <Flex flexDir={'column'} textUnderlineOffset={4}>
            <Heading
              as={'h3'}
              size={'md'}
              fontWeight={'bold'}
              noOfLines={1}
              wordBreak={'break-word'}
            >
              <Link href={`/locations/${location?.id}/general`}>
                {location?.name || "Location"}
              </Link>
            </Heading>
            <Tooltip label={toActualTime(location?.updatedAt as string)}>
              <Flex align={'center'} color={'gray.500'} gap={1} fontSize={'md'}>
                <Icon as={BiRefresh} />
                <Text color={'gray.500'} cursor={'help'}>
                  {
                    toRelativeTime(location?.updatedAt as string)
                  }
                </Text>
              </Flex>
            </Tooltip>
          </Flex>
        </Skeleton>
      </Flex>
    </Tooltip>
  </>
}

function TableEntry({ key, location, skeleton }: { key: number | string, location?: Location, skeleton?: boolean }) {
  const { push } = useRouter();

  return <>
    <Tr key={key}>
      <Td>
        <Stack flexDir={'row'} align={'center'}>
          <Skeleton isLoaded={!skeleton}>
            <Tooltip label={location?.roblox?.place?.name || location?.name} placement={'top'}>
              <Avatar as={Link} href={location?.roblox?.place ? `https://www.roblox.com/games/${location?.roblox?.place?.rootPlaceId}/game` : `/locations/${location?.id}/general`} target={location?.roblox?.place ? '_blank' : '_self'} transition={'opacity 0.2s ease-out'} _hover={{ opacity: 0.75 }} _active={{ opacity: 0.5 }} borderRadius={'lg'} size={'md'} src={location?.roblox?.place?.thumbnail || '/images/default-avatar-location.png'} />
            </Tooltip>
          </Skeleton>

          <Flex flexDir={'column'} mx={2} justify={'center'}>
            <Skeleton isLoaded={!skeleton}>
              <Text fontWeight={'bold'}>
                {!skeleton ? location?.name : "Location Name"}
              </Text>
              {!skeleton && location?.roblox?.place && (
                <Text variant={'subtext'} fontWeight={'bold'}>
                  {location?.roblox?.place?.name}
                </Text>
              )}
              <Tooltip label={toActualTime(location?.updatedAt as string)}>
                <Flex align={'center'} color={'gray.500'} gap={1} w={'fit-content'}>
                  <Icon as={BiRefresh} />
                  <Text size={'sm'} cursor={'help'}>
                    {!skeleton ? toRelativeTime(location?.updatedAt as string) : "Last Updated"}
                  </Text>
                </Flex>
              </Tooltip>
              <Text variant={'subtext'} maxW={'lg'} whiteSpace={'pre-wrap'}>
                {!skeleton ? location?.description || "No description available." : "Location Description"}
              </Text>
            </Skeleton>
          </Flex>
        </Stack>
      </Td>
      <Td isNumeric>
        <Skeleton isLoaded={!skeleton}>
          <ButtonGroup>
            {
              location?.roblox?.place && (
                <Button
                  onClick={() => {
                    window.open(`https://www.roblox.com/games/${location?.roblox?.place?.rootPlaceId}/game`, '_blank');
                  }}
                  size={"sm"}
                  variant={"solid"}
                  colorScheme='gray'
                  textDecor={"unset !important"}
                >
                  View Experience
                </Button>
              )
            }
            <Button
              onClick={() => {
                push(`/locations/${location?.id}/general`)
              }}
              size={"sm"}
              variant={"solid"}
              colorScheme='black'
              textDecor={"unset !important"}
              leftIcon={<Icon as={AiFillSetting} />}
            >
              Manage
            </Button>
          </ButtonGroup>
        </Skeleton>
      </Td>
    </Tr >
  </>
}

export default function PlatformLocations() {
  const { query, push } = useRouter();

  // Fetch locations
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState<boolean>(true);
  const [filteredLocations, setFilteredLocations] = useState<any>([]);

  // Fetch organizations
  const [organizations, setOrganizations] = useState<any>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState<boolean>(true);

  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const { user } = useAuthContext();

  const [view, setView] = useState<'list' | 'grid' | undefined>();
  const searchRef = useRef<HTMLInputElement>(null);

  const {
    isOpen: isCreateLocationModalOpen,
    onOpen: onCreateLocationModalOpen,
    onClose: onCreateLocationModalClose
  } = useDisclosure();

  const toRelativeTime = useMemo(() => (date: string) => {
    return moment(new Date(date)).fromNow();
  }, []);

  const refreshOrganizations = useCallback(async () => {
    if (!user) return;
    await user.getIdToken().then(async (token: string) => {
      await fetch('/api/v1/me/organizations', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          setOrganizations(data.organizations);
          if (data?.organizations?.length === 0) {
            setOrganizationsLoading(false);
          }
        })
        .finally(() => {
          setOrganizationsLoading(false);
        });
    });
  }, [user]);

  const refreshLocations = useCallback(async () => {
    if (!user) return;
    if (!selectedOrganization) return;
    setLocationsLoading(true);
    await user.getIdToken().then(async (token: string) => {
      await fetch(`/api/v1/organizations/${selectedOrganization.id}/locations`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          setTimeout(() => {
            setLocations(data.locations);
            setLocationsLoading(false);
          }, 100);
        })
    });
  }, [selectedOrganization, user]);

  const filterLocations = useCallback((query: string) => {
    if (!query) {
      setFilteredLocations(locations);
      return;
    }
    const filtered = locations.filter((location: Location) => {
      return location.name.toLowerCase().includes(query.toLowerCase());
    });
    setFilteredLocations(filtered);
  }, [locations]);

  useEffect(() => {
    if (!user) return;
    refreshOrganizations();
  }, [user, refreshOrganizations]);

  useEffect(() => {
    if (!user || !selectedOrganization) return;
    refreshLocations();
    localStorage.setItem('defaultOrganization', selectedOrganization.id);
  }, [selectedOrganization, user, refreshLocations]);

  useEffect(() => {
    if (!organizations) return;
    setSelectedOrganization(organizations[0]);
  }, [organizations]);

  useEffect(() => {
    if (!query.organization) {
      const defaultOrganization = localStorage.getItem('defaultOrganization');
      if (organizations && defaultOrganization) {
        const organizationOption = organizations.find((organization: any) => organization.id === defaultOrganization);
        if (!organizationOption) return;
        setSelectedOrganization(organizationOption);
      }
      return;
    };
    const organization = organizations.find((organization: any) => organization.id === query.organization);
    setSelectedOrganization(organization);
  }, [organizations, query.organization]);

  useEffect(() => {
    // load view option from local storage
    const viewOption = localStorage.getItem('locationView');
    if (viewOption) {
      setView(viewOption as 'list' | 'grid');
    } else {
      setView('list');
      localStorage.setItem('locationView', 'list');
    }
  }, []);

  useEffect(() => {
    // cache view option in local storage
    if (!view) return;
    localStorage.setItem('locationView', view);
  }, [view]);

  useEffect(() => {
    if (!locations) return;
    setFilteredLocations(locations);
  }, [locations]);

  return (
    <>
      <Head>
        <title>Locations - Restrafes XCS</title>
        <meta
          property="og:title"
          content="Manage Locations - Restrafes XCS"
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
      <CreateLocationDialog
        isOpen={isCreateLocationModalOpen}
        onClose={onCreateLocationModalClose}
        selectedOrganization={selectedOrganization}
        onCreate={(id) => {
          push(`/locations/${id}`);
        }}
      />
      <Container
        maxW={'full'}
        p={8}
      >
        <Text
          as={'h1'}
          fontSize={'4xl'}
          fontWeight={'900'}
        >
          Locations
        </Text>
        <Stack
          flexDir={{ base: 'column', lg: 'row' }}
          display={'flex'}
          justify={'flex-start'}
          gap={4}
          pt={4}
        >
          <Button
            leftIcon={<MdOutlineAddCircle />}
            onClick={onCreateLocationModalOpen}
            isDisabled={!selectedOrganization}
          >
            New Location
          </Button>
          <FormControl w={{ base: 'full', md: '320px' }}>
            <Select
              value={
                {
                  label: selectedOrganization?.name,
                  value: selectedOrganization?.id
                } as any
              }
              onChange={(e: { label: string; value: string }) => {
                const organization = organizations.find((organization: any) => organization.id === e.value);
                setSelectedOrganization(organization);
              }}
              isReadOnly={organizationsLoading}
              options={
                organizations.map((organization: any) => ({
                  label: organization.name,
                  value: organization.id
                })) || []
              }
              variant='filled'
              selectedOptionStyle="check"
            />
          </FormControl>
          <Input
            placeholder={'Search'}
            variant={'filled'}
            w={{ base: 'full', md: 'auto' }}
            ref={searchRef}
            onChange={(e) => {
              filterLocations(e.target.value);
            }}
          />
          <Spacer />
          <Flex w={'fit-content'} gap={4}>
            <ButtonGroup>
              <Tooltip label={'Refresh'} placement={'top'}>
                <IconButton aria-label={'Refresh'} icon={<BiRefresh />}
                  onClick={refreshLocations}
                />
              </Tooltip>
            </ButtonGroup>
            <ButtonGroup isAttached>
              <Tooltip label={'List'} placement={'top'}>
                <IconButton aria-label={'List'} variant={view === "list" ? "solid" : "unselected"} onClick={() => { setView('list') }} icon={<BsListUl />} />
              </Tooltip>
              <Tooltip label={'Grid'} placement={'top'}>
                <IconButton aria-label={'Grid'} variant={view === "grid" ? "solid" : "unselected"} onClick={() => { setView('grid') }} icon={<BiGrid />} />
              </Tooltip>
            </ButtonGroup>
          </Flex>
        </Stack>
        <Box w={"full"}>
          <Flex
            as={Stack}
            direction={'row'}
            h={'full'}
            spacing={4}
            overflow={'auto'}
            flexWrap={'wrap'}
          >
            {
              organizations.length ? (view === 'list' ? (
                <TableContainer
                  py={2}
                  maxW={{ base: 'full' }}
                  overflowY={'auto'}
                  flexGrow={1}
                  px={4}
                >
                  <Table size={{ base: 'md', md: 'md' }}>
                    <Thead>
                      <Tr>
                        <Th>Location</Th>
                        <Th isNumeric>Actions</Th>
                      </Tr>
                    </Thead>
                    {/* display list of organizations */}
                    <Tbody>
                      {
                        locationsLoading ? (
                          Array.from({ length: 6 }).map((_, i) => (
                            <TableEntry key={i} location={undefined} skeleton={true} />
                          ))
                        ) : (filteredLocations.map((location: Location) => (
                          <TableEntry key={location.id as string} location={location} skeleton={false} />
                        )))
                      }
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                <Flex py={8} gap={4} wrap={'wrap'}>
                  {
                    locationsLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <GridEntry key={i} />
                      ))
                    ) : (
                      filteredLocations.map((location: Location) => (
                        <GridEntry key={location.id} location={location} />
                      ))
                    )
                  }
                </Flex>
              )) : null}
            {
              !locationsLoading && filteredLocations.length === 0 && (
                <Flex
                  flexDir={'column'}
                  align={'center'}
                  justify={'center'}
                  w={'full'}
                  h={'full'}
                  py={4}
                >
                  <Text fontSize={'2xl'} fontWeight={'bold'}>No Locations Found</Text>
                  <Text color={'gray.500'}>Try adjusting your search query or create a new location.</Text>
                </Flex>
              )
            }
            {
              !organizationsLoading && !organizations.length && (
                <Flex
                  flexDir={'column'}
                  align={'center'}
                  justify={'center'}
                  w={'full'}
                  h={'full'}
                  py={16}
                >
                  <Text fontSize={'2xl'} fontWeight={'bold'}>No Organizations Found</Text>
                  <Text color={'gray.500'}>Create or join a new organization to get started.</Text>
                </Flex>
              )
            }
          </Flex>
        </Box>
      </Container >
    </>
  );
}

PlatformLocations.getLayout = (page: any) => <Layout>{page}</Layout>;
