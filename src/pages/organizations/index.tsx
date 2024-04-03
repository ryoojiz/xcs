/* eslint-disable react-hooks/rules-of-hooks */
import { Key, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
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
  useDisclosure,
  useToast
} from '@chakra-ui/react';

import { Link } from '@chakra-ui/next-js';

import { MdMail, MdOutlineAddCircle, MdOutlineJoinRight } from 'react-icons/md';

import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuthContext } from '@/contexts/AuthContext';

import Layout from '@/layouts/PlatformLayout';

import CreateOrganizationDialog from '@/components/CreateOrganizationDialog';
import JoinOrganizationDialog from '@/components/JoinOrganizationDialog';
import UserInvitationsModal from '@/components/UserInvitationsModal';
import { Organization, OrganizationMember } from '@/types';
import moment from 'moment';
import { AiFillSetting } from 'react-icons/ai';
import { BiGrid, BiRefresh } from 'react-icons/bi';
import { BsListUl } from 'react-icons/bs';

const toRelativeTime = (date: string) => {
  return moment(new Date(date)).fromNow();
};
const toActualTime = (date: string) => {
  return moment(new Date(date)).format('MMMM Do YYYY, h:mm:ss a');
}

function GridEntry({ key, organization }: { key: Key, organization?: Organization }) {
  return <>
    <Tooltip placement={'top'} label={organization?.name} key={key}>
      <Flex flexDir={'column'} w={{ base: '45%', md: '128px', lg: '224px' }}>
        {/* icon */}
        <Skeleton isLoaded={!!organization}>
          <Flex
            border={'1px solid'}
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            borderRadius={'lg'}
            overflow={'hidden'}
            aspectRatio={1 / 1}
          >
            <Avatar
              as={Link}
              href={`/organizations/${organization?.id}/settings`}
              ignoreFallback={true}
              borderRadius={'none'}
              size={'lg'}
              src={organization?.avatar || '/images/default-avatar-organization.png'}
              cursor={'pointer'}
              w={'full'}
              h={'full'}
              transition={'opacity 0.2s ease-out'} _hover={{ opacity: 0.75 }} _active={{ opacity: 0.5 }}
            />
          </Flex>
        </Skeleton>
        {/* text */}
        <Skeleton isLoaded={!!organization} my={4} px={2}>
          <Flex flexDir={'column'} textUnderlineOffset={4}>
            <Heading
              as={'h3'}
              size={'md'}
              fontWeight={'bold'}
              noOfLines={1}
              wordBreak={'break-word'}
            >
              <Link href={`/organizations/${organization?.id}/settings`}>
                {organization?.name || "Organization"}
              </Link>
            </Heading>
            <Text color={"gray.500"}>
              by{' '}
              <Link href={`/@${organization?.owner?.username}`}>
                {organization?.owner?.displayName}
              </Link>
            </Text>
            <Tooltip label={toActualTime(organization?.updatedAt as string)} cursor={'help'}>
              <Flex align={'center'} color={'gray.500'} gap={1} fontSize={'md'}>
                <Icon as={BiRefresh} />
                <Text color={'gray.500'}>
                  {
                    toRelativeTime(organization?.updatedAt as string)
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

function TableEntry({ key, organization, skeleton }: { key: number | string, organization?: Organization, skeleton?: boolean }) {
  const { push } = useRouter();

  return <>
    <Tr key={key}>
      <Td>
        <Stack flexDir={'row'} align={'center'}>
          <Skeleton isLoaded={!skeleton}>
            <Tooltip label={organization?.name} placement={'top'}>
              <Avatar as={Link} href={`/organizations/${organization?.id}`} transition={'opacity 0.2s ease-out'} _hover={{ opacity: 0.75 }} _active={{ opacity: 0.5 }} borderRadius={'lg'} size={'md'} src={organization?.avatar || '/images/default-avatar-organization.png'} />
            </Tooltip>
          </Skeleton>

          <Flex flexDir={'column'} mx={2} justify={'center'}>
            <Skeleton isLoaded={!skeleton}>
              <Text fontWeight={'bold'}>
                {!skeleton ? organization?.name : "Organization Name"}
              </Text>
              <Text size={'sm'} variant={'subtext'} textUnderlineOffset={4}>
                Owned by {!skeleton ? <Link href={`/@${organization?.owner?.username}`}>{organization?.owner?.displayName}</Link> : "Organization Owner"}
              </Text>
              <Tooltip label={toActualTime(organization?.updatedAt as string)}>
                <Flex align={'center'} color={'gray.500'} gap={1} w={'fit-content'}>
                  <Icon as={BiRefresh} />
                  <Text size={'sm'} textUnderlineOffset={4} cursor={'help'}>
                    {!skeleton ? toRelativeTime(organization?.updatedAt) : "Last Updated"}
                    {!skeleton && organization?.updatedBy && " by "}
                    {!skeleton ? <Link href={`/@${organization?.updatedBy?.username}`}>{organization?.updatedBy?.displayName}</Link> : "Organization Owner"}
                  </Text>
                </Flex>
              </Tooltip>
              <Text size={'sm'} variant={'subtext'} maxW={{ base: '500px', md: '384px', lg: '500px' }} overflow={'hidden'} textOverflow={'ellipsis'}>
                {!skeleton ? organization?.description : "Organization Description"}
              </Text>
            </Skeleton>
          </Flex>
        </Stack>
      </Td>
      <Td isNumeric>
        <Skeleton isLoaded={!skeleton}>
          <ButtonGroup>
            <Button
              onClick={() => {
                push(`/organizations/${organization?.id}`);
              }}
              size={"sm"}
              variant={"solid"}
              textDecor={"unset !important"}
            >
              View Public Page
            </Button>
            <Button
              onClick={() => {
                push(`/organizations/${organization?.id}/settings`);
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
    </Tr>
  </>
}
export default function PlatformOrganizations() {
  const { user, currentUser } = useAuthContext();
  const { push, query } = useRouter();
  const toast = useToast();

  const [queryLoading, setQueryLoading] = useState<boolean>(true);
  const [organizationsLoading, setOrganizationsLoading] = useState<boolean>(true);

  const [organizations, setOrganizations] = useState<any>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<any>([]);
  const [initialInviteCodeValue, setInitialInviteCodeValue] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<'list' | 'grid' | null>(null);

  // modal disclosure hooks

  const {
    isOpen: isCreateOrganizationModalOpen,
    onOpen: onCreateOrganizationModalOpen,
    onClose: onCreateOrganizationModalClose
  } = useDisclosure();

  const {
    isOpen: isJoinOrganizationModalOpen,
    onOpen: onJoinOrganizationModalOpen,
    onClose: onJoinOrganizationModalClose
  } = useDisclosure();

  const {
    isOpen: isViewInvitationsModalOpen,
    onOpen: onViewInvitationsModalOpen,
    onClose: onViewInvitationsModalClose
  } = useDisclosure();

  const refreshData = useCallback(async () => {
    setOrganizationsLoading(true);
    const token = await user?.getIdToken().then((token: string) => token);
    await fetch('/api/v1/me/organizations', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => {
      if (res.status !== 200) {
        throw new Error('Failed to fetch organizations.');
      }
      res
        .json()
        .then((data) => {
          setTimeout(() => {
            setOrganizations(data.organizations);
            setOrganizationsLoading(false);
          }, 100);
        })
        .catch((err) => {
          toast({
            title: 'Error',
            description: err.message,
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        });
    }).catch((err) => {
      toast({
        title: 'There was an error fetching your organizations.',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    });
  }, [toast, user]);

  useEffect(() => {
    if (!user) return;
    refreshData();
  }, [user, refreshData]);

  const joinOrganizationPrompt = useCallback(async (inviteCode: string) => {
    setQueryLoading(true);
    setInitialInviteCodeValue(inviteCode);
    setQueryLoading(false);
    onJoinOrganizationModalOpen();
  }, [onJoinOrganizationModalOpen]);

  useEffect(() => {
    if (!query) return;
    if (query.invitation) {
      joinOrganizationPrompt(query.invitation as string);
    } else {
      setTimeout(() => {
        setQueryLoading(false);
      }, 100);
    }
  }, [query.invitation, joinOrganizationPrompt, query]);

  const filterOrganizations = useCallback((query: string) => {
    if (!query) {
      setFilteredOrganizations(organizations);
      return;
    }
    const filtered = organizations.filter((organization: Organization) => {
      return organization.name.toLowerCase().includes(query.toLowerCase()) || organization.owner?.displayName?.toLowerCase().includes(query.toLowerCase());
    });
    setFilteredOrganizations(filtered);
  }, [organizations]);

  const toRelativeTime = useMemo(() => (date: string) => {
    return moment(new Date(date)).fromNow();
  }, []);

  useEffect(() => {
    // load view option from local storage
    const viewOption = localStorage.getItem('organizationView');
    if (viewOption) {
      setView(viewOption as 'list' | 'grid');
    } else {
      setView('list');
      localStorage.setItem('organizationView', 'list');
    }
  }, []);

  useEffect(() => {
    // cache view option in local storage
    if (!view) return;
    localStorage.setItem('organizationView', view);
  }, [view]);

  useEffect(() => {
    if (!organizations) return;
    setFilteredOrganizations(organizations);
  }, [organizations]);

  return (
    <>
      <Head>
        <title>Organizations - Restrafes XCS</title>
        <meta
          property="og:title"
          content="Manage Organizations - Restrafes XCS"
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
          property="og:type"
          content="website"
        />
        <meta
          property="og:image"
          content="/images/logo-square.jpg"
        />
      </Head>
      <CreateOrganizationDialog
        isOpen={isCreateOrganizationModalOpen}
        onClose={onCreateOrganizationModalClose}
        onCreate={(id) => {
          push(`/organizations/${id}/settings`);
        }}
      />
      {!queryLoading && (
        <JoinOrganizationDialog
          isOpen={isJoinOrganizationModalOpen}
          onClose={onJoinOrganizationModalClose}
          onJoin={(id) => {
            push(`/organizations/${id}/settings`);
          }}
          initialValue={initialInviteCodeValue || ''}
        />
      )}
      <UserInvitationsModal
        isOpen={isViewInvitationsModalOpen}
        onClose={onViewInvitationsModalClose}
        onRefresh={refreshData}
      />
      <Container
        maxW={'full'}
        p={8}
      >
        <Text
          as={'h1'}
          fontSize={'4xl'}
          fontWeight={'900'}
          pb={4}
        >
          Organizations
        </Text>
        <Stack
          flexDir={{ base: 'column', lg: 'row' }}
          display={'flex'}
          justify={'flex-start'}
          gap={4}
        >
          <Button
            variant={'solid'}
            leftIcon={<MdOutlineAddCircle />}
            onClick={onCreateOrganizationModalOpen}
          >
            New
          </Button>
          <Button
            variant={'solid'}
            leftIcon={<MdOutlineJoinRight />}
            onClick={onJoinOrganizationModalOpen}
          >
            Join
          </Button>
          <Button
            variant={'solid'}
            leftIcon={<MdMail />}
            onClick={onViewInvitationsModalOpen}
          >
            View Invitations
            <Flex as={'span'} fontFamily={'sans-serif'} align={'center'} justify={'center'} ml={2} px={2} borderRadius={'full'} minW={'1.5em'} h={'1.5em'} bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.200')}>{" "}{currentUser?.statistics?.organizationInvitations || 0}</Flex>
          </Button>
          <Input
            placeholder={'Search'}
            variant={'filled'}
            w={{ base: 'full', md: 'auto' }}
            ref={searchRef}
            onChange={(e) => {
              filterOrganizations(e.target.value);
            }}
          />
          <Spacer />
          <Flex w={'fit-content'} gap={4}>
            <ButtonGroup>
              <Tooltip label={'Refresh'} placement={'top'}>
                <IconButton aria-label={'Refresh'} icon={<BiRefresh />}
                  onClick={refreshData}
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
              view === 'list' ? (
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
                        <Th>Organization</Th>
                        <Th isNumeric>Actions</Th>
                      </Tr>
                    </Thead>
                    {/* display list of organizations */}
                    <Tbody>
                      {
                        organizationsLoading ? (
                          Array.from({ length: 6 }).map((_, i) => (
                            <TableEntry key={i} organization={undefined} skeleton={true} />
                          ))
                        ) : (filteredOrganizations.map((organization: Organization) => (
                          <TableEntry key={organization.id as string} organization={organization} skeleton={false} />
                        )))
                      }
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                <Flex py={8} gap={4} wrap={'wrap'}>
                  {
                    organizationsLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <GridEntry key={i} />
                      ))
                    ) : (
                      filteredOrganizations.map((organization: Organization) => (
                        <GridEntry key={organization.id} organization={organization} />
                      ))
                    )
                  }
                </Flex>
              )}
            {
              !organizationsLoading && filteredOrganizations.length === 0 && (
                <Flex
                  flexDir={'column'}
                  align={'center'}
                  justify={'center'}
                  w={'full'}
                  h={'full'}
                  py={4}
                >
                  <Text fontSize={'2xl'} fontWeight={'bold'}>No Organizations Found</Text>
                  <Text color={'gray.500'}>Try adjusting your search query or create a new organization.</Text>
                </Flex>
              )
            }
          </Flex>
        </Box>
      </Container>
    </>
  );
}

PlatformOrganizations.getLayout = (page: any) => <Layout>{page}</Layout>;
