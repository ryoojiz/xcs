import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Link } from '@chakra-ui/next-js';
import {
  Avatar,
  AvatarGroup,
  Box,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  Button,
  Center,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  Portal,
  Skeleton,
  Stack,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  chakra,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react';

import { ChevronRightIcon } from '@chakra-ui/icons';

import { BiSolidExit } from 'react-icons/bi';
import { BsFillPencilFill } from 'react-icons/bs';
import { HiGlobeAlt, HiUserGroup } from 'react-icons/hi';
import { ImTree } from 'react-icons/im';
import { IoIosRemoveCircle } from 'react-icons/io';
import { IoEye, IoSave } from 'react-icons/io5';
import { RiProfileFill } from 'react-icons/ri';

import { Field, Form, Formik } from 'formik';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuthContext } from '@/contexts/AuthContext';

import Layout from '@/layouts/PlatformLayout';

import AccessGroupEditModal from '@/components/AccessGroupEditModal';
import DeleteDialog from '@/components/DeleteDialog';
import DeleteDialogOrganization from '@/components/DeleteDialogOrganization';
import MemberEditModal from '@/components/MemberEditModal';
import StatBox from '@/components/StatBox';
import { TooltipAvatar } from '@/components/TooltipAvatar';
import { Organization, OrganizationMember, ScanEvent } from '@/types';
import moment from 'moment';
import { FaBan, FaCheck } from 'react-icons/fa';
import { SiRoblox } from 'react-icons/si';

const memberTypeOrder = ['user', 'roblox', 'roblox-group', 'card'];

function ActionButton({ children, ...props }: any) {
  return (
    <Flex
      {...props}
      h={'auto'} border='1px solid' p={0} borderColor={useColorModeValue('gray.200', 'gray.700')} borderRadius='lg'
      transition={'background 0.2s ease-out'}
      _hover={{
        bg: useColorModeValue('gray.50', 'gray.700')
      }}
      _active={{
        bg: useColorModeValue('gray.100', 'gray.600')
      }}
    >
      <Button w={'full'} h={'full'} m={"0 !important"} py={4} >
        <Center as={Flex} flexDir={'column'}>
          {children}
        </Center>
      </Button>
    </Flex>
  );
}
export default function PlatformOrganization() {
  const { query, push } = useRouter();
  const { user, currentUser } = useAuthContext();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [scanEvents, setScanEvents] = useState<ScanEvent[] | null>(null);

  const toast = useToast();

  const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();

  const { isOpen: isLeaveDialogOpen, onOpen: onLeaveDialogOpen, onClose: onLeaveDialogClose } = useDisclosure();

  const { isOpen: roleModalOpen, onOpen: roleModalOnOpen, onClose: roleModalOnClose } = useDisclosure();

  const { isOpen: memberModalOpen, onOpen: memberModalOnOpen, onClose: memberModalOnClose } = useDisclosure();

  const defaultImage = `${process.env.NEXT_PUBLIC_ROOT_URL}/images/default-avatar-organization.png`;
  const [image, setImage] = useState<null | undefined | string>(undefined);
  const [croppedImage, setCroppedImage] = useState<null | string>(null);

  const avatarChooser = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const toRelativeTime = useMemo(() => (date: Date) => {
    return moment(new Date(date)).fromNow();
  }, []);

  const toActualTime = useMemo(() => (date: Date) => {
    return moment(new Date(date)).format('MMMM Do YYYY, h:mm:ss a');
  }, []);

  const handleChange = useCallback(async (e: any) => {
    console.log(e.target.files[0]);
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);

    // check if file is an image
    if (file.type.split('/')[0] !== 'image') {
      toast({
        title: 'File is not an image.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    reader.onloadend = () => {
      setImage(reader.result as string);
    };
  }, [toast]);

  const removeAvatar = useCallback(() => {
    // download default avatar and set it as the image
    fetch(defaultImage)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
      });
  }, [defaultImage]);

  useEffect(() => {
    if (!organization) return;
    setImage(organization?.avatar);
  }, [organization]);

  const onLeave = useCallback(async () => {
    await user.getIdToken().then((token: string) => {
      fetch(`/api/v1/organizations/${query.id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.status === 200) {
            return res.json();
          } else {
            return res.json().then((json: any) => {
              throw new Error(json.message);
            });
          }
        })
        .then((data) => {
          toast({
            title: data.message,
            status: 'success',
            duration: 5000,
            isClosable: true
          });
          push('/organizations');
        })
        .catch((err) => {
          toast({
            title: 'Error',
            description: err.message,
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        })
        .finally(() => {
          onLeaveDialogClose();
        });
    });
  }, [onLeaveDialogClose, push, query.id, toast, user]);

  const onDelete = useCallback(async () => {
    await user.getIdToken().then(async (token: string) => {
      await fetch(`/api/v1/organizations/${query.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.status === 200) {
            return res.json();
          } else {
            return res.json().then((json: any) => {
              throw new Error(json.message);
            });
          }
        })
        .then((data) => {
          toast({
            title: data.message,
            status: 'success',
            duration: 5000,
            isClosable: true
          });
          push('/organizations');
        })
        .catch((err) => {
          toast({
            title: 'Error',
            description: err.message,
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        })
        .finally(() => {
          onDeleteDialogClose();
        });
    });
  }, [onDeleteDialogClose, push, query.id, toast, user]);

  let refreshData = useCallback(async () => {
    const token = await user.getIdToken();
    await fetch(`/api/v1/organizations/${query.id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 200) return res.json();
        push('/organizations');
        switch (res.status) {
          case 404:
            throw new Error('Organization not found.');
          case 403:
            throw new Error('You do not have permission to view this organization.');
          case 401:
            throw new Error('You do not have permission to view this organization.');
          case 500:
            throw new Error('An internal server error occurred.');
          default:
            throw new Error('An unknown error occurred.');
        }
      })
      .then((data) => {
        setOrganization(data.organization);
      }).then(async () => {
        await fetch(`/api/v1/organizations/${query.id}/scans`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => {
            if (res.status === 200) return res.json();
            toast({ title: 'There was a problem fetching the organization\'s scan events.', status: 'error', duration: 5000, isClosable: true });
          })
          .then((data) => {
            setScanEvents(data);
          })
          .catch((err) => { });
      })
      .catch((err) => {
        toast({
          title: 'There was an error fetching the organization.',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      });
  }, [push, query.id, toast, user]);

  const onMemberRemove = useCallback(async (member: any) => {
    await user.getIdToken().then(async (token: string) => {
      await fetch(`/api/v1/organizations/${query.id}/members/${member.formattedId || member.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.status === 200) {
            return res.json();
          } else {
            return res.json().then((json: any) => {
              throw new Error(json.message);
            });
          }
        })
        .then((data) => {
          toast({
            title: data.message,
            status: 'success',
            duration: 5000,
            isClosable: true
          });
          refreshData();
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
    });
  }, [query.id, refreshData, toast, user]);

  const onGroupRemove = useCallback(async (group: any) => {
    await user.getIdToken().then((token: string) => {
      fetch(`/api/v1/organizations/${query.id}/access-groups/${group.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.status === 200) {
            return res.json();
          } else {
            return res.json().then((json: any) => {
              throw new Error(json.message);
            });
          }
        })
        .then((data) => {
          toast({
            title: data.message,
            status: 'success',
            duration: 5000,
            isClosable: true
          });
          refreshData();
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
    });
  }, [query.id, refreshData, toast, user]);

  // Fetch organization data
  useEffect(() => {
    if (!user) return;
    if (!query.id) return;
    refreshData();
  }, [query.id, user, refreshData]);

  return (
    <>
      <Head>
        <title>{organization?.name} - Amperra Wyre</title>
        <meta
          property="og:title"
          content="Manage Organization - Amperra Wyre"
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
      <DeleteDialogOrganization
        isOpen={isDeleteDialogOpen}
        onClose={onDeleteDialogClose}
        onDelete={onDelete}
        organization={organization}
      />
      <DeleteDialog
        title="Leave Organization"
        body="Are you sure you want to leave this organization?"
        isOpen={isLeaveDialogOpen}
        onClose={onLeaveDialogClose}
        onDelete={onLeave}
        buttonText="Leave"
      />
      <AccessGroupEditModal
        isOpen={roleModalOpen}
        onOpen={roleModalOnOpen}
        onClose={roleModalOnClose}
        onRefresh={refreshData}
        organization={organization}
        clientMember={Object.values(organization?.members || {}).find((member: any) => member.id === user?.uid) || null}
        // filter groups to only include groups that contain locationId
        groups={Object.values(organization?.accessGroups || {}).filter((group: any) => group.type === 'organization')}
        onGroupRemove={onGroupRemove}
      />
      <MemberEditModal
        isOpen={memberModalOpen}
        onOpen={memberModalOnOpen}
        onClose={memberModalOnClose}
        onRefresh={refreshData}
        members={organization?.members || {}}
        organization={organization}
        clientMember={Object.values(organization?.members || {}).find((member: any) => member.id === user?.uid) || null}
        onMemberRemove={onMemberRemove}
      />
      <Container
        maxW={'full'}
        p={8}
      >
        <Breadcrumb
          // display={{ base: 'none', md: 'flex' }}
          spacing="8px"
          mb={2}
          separator={<ChevronRightIcon color="gray.500" />}
          fontSize={{ base: 'sm', md: 'md' }}
        >
          <BreadcrumbItem>
            <BreadcrumbLink
              as={Link}
              href="/home"
              textUnderlineOffset={4}
            >
              Platform
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              as={Link}
              href={`/organizations`}
              textUnderlineOffset={4}
            >
              Organizations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink
              href="#"
              textUnderlineOffset={4}
            >
              {organization?.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <Flex display={'grid'} gridTemplateColumns={{ base: '1fr', xl: '1fr 1fr' }} minH={'calc(100vh - 6rem)'} gap={{ base: 4, xl: 16 }}>
          {/* <Flex flexDir={{ base: 'column', '2xl': 'row' }} justify={'space-between'} align={'flex-start'} minH={'calc(100vh - 6rem)'} gap={{ base: 4, '2xl': 16 }}> */}
          <Flex flexDir={'column'} flex={1} h={'100%'}>
            <Stack
              direction={'row'}
              align={'center'}
              gap={6}
              py={4}
            >
              <Skeleton
                isLoaded={!!organization}
                borderRadius={'lg'}
                ref={avatarRef}
                onClick={() => {
                  avatarChooser.current?.click();
                }}
              >
              </Skeleton>
              <Flex flexDir={'column'}>
                <Skeleton isLoaded={!!organization}>
                  <Text
                    as={'h1'}
                    fontSize={{ base: '2xl', md: '4xl' }}
                    fontWeight={'bold'}
                    lineHeight={0.9}
                  >
                    {organization?.name || 'Organization Name'}
                  </Text>
                </Skeleton>
                <Skeleton
                  isLoaded={!!organization}
                  my={2}
                >
                  <Text
                    fontSize={'md'}
                    fontWeight={'500'}
                    color={'gray.500'}
                  >
                    Owned by{' '}
                    <Link
                      as={Link}
                      textUnderlineOffset={4}
                      href={`/@${organization?.owner?.username}`}
                    >
                      {organization?.owner?.displayName || 'Organization Owner'}
                    </Link>
                  </Text>
                </Skeleton>
                <Skeleton
                  isLoaded={!!organization}
                >
                  <AvatarGroup
                    size={'md'}
                    max={4}
                  >
                    <TooltipAvatar
                      name={organization?.owner?.displayName}
                      as={Link}
                      key={organization?.owner?.id}
                      href={`/@${organization?.owner?.username}`}
                      src={organization?.owner?.avatar || defaultImage}
                    />
                    {Object.values(organization?.members || {})
                      .filter((member: OrganizationMember) => ['user'].includes(member.type))
                      .sort((a: OrganizationMember, b: OrganizationMember) => ((memberTypeOrder.indexOf(a.type) - a.role) - (memberTypeOrder.indexOf(b.type) - b.role)))
                      .map(
                        (member: OrganizationMember) =>
                          member.id !== organization?.owner?.id &&
                          (!member.type.startsWith('roblox') ? (
                            <TooltipAvatar
                              name={member?.displayName}
                              as={Link}
                              key={member?.id}
                              href={`/@${member?.username}`}
                              src={member?.avatar}
                              bg={'gray.300'}
                            />
                          ) : member.type === 'roblox' ? (
                            <TooltipAvatar
                              name={`${member?.displayName} (${member?.username})`}
                              as={Link}
                              key={member?.id}
                              href={`https://www.roblox.com/users/${member?.id}/profile`}
                              src={member?.avatar}
                              bg={'gray.300'}
                              target={'_blank'}
                            />
                          ) : (
                            <>
                              <TooltipAvatar
                                name={member?.displayName}
                                as={Link}
                                key={member?.id}
                                href={`https://www.roblox.com/groups/${member?.id}/group`}
                                src={member?.avatar}
                                bg={'gray.300'}
                                target={'_blank'}
                              />
                            </>
                          ))
                      )}
                  </AvatarGroup>
                </Skeleton>
              </Flex>
            </Stack>
            <Divider my={4} />
            <Heading as="h1" size="lg" my={2}>
              Manage
            </Heading>
            <Flex display={'grid'} gridTemplateColumns={'1fr 1fr'} flexWrap={'wrap'} w={'full'} h={'auto'} py={2} gap={4} justify={'space-evenly'}>
              <ActionButton
                onClick={memberModalOnOpen}
              >
                <Icon as={HiUserGroup} m={2} w={8} h={8} />
                <Text fontWeight={'bold'} fontSize={'md'}>Members</Text>
              </ActionButton>
              <ActionButton
                onClick={roleModalOnOpen}
              >
                <Icon as={HiGlobeAlt} m={2} w={8} h={8} />
                <Text fontWeight={'bold'} fontSize={'md'}>Access Groups</Text>
              </ActionButton>
              <ActionButton
                onClick={() => {
                  push(`/organizations/${query.id}`);
                }}
              >
                <Icon as={RiProfileFill} m={2} w={8} h={8} />
                <Text fontWeight={'bold'} fontSize={'md'}>View Public Page</Text>
              </ActionButton>
              <ActionButton
                onClick={() => {
                  push(`/locations/?organization=${query.id}`);
                }}
              >
                <Icon as={ImTree} m={2} w={8} h={8} />
                <Text fontWeight={'bold'} fontSize={'md'}>View Locations</Text>
              </ActionButton>
            </Flex>
            <Divider my={4} />
            <Heading as="h1" size="lg" my={2}>
              Settings
            </Heading>
            <Box
              my={2}
            >
              <Skeleton
                isLoaded={!!organization}
              >
                <Formik
                  initialValues={{
                    name: organization?.name,
                    description: organization?.description,
                    members: JSON.stringify(organization?.members),
                    accessGroups: JSON.stringify(organization?.accessGroups)
                  }}
                  onSubmit={(values, actions) => {
                    try {
                      JSON.parse(values.members);
                      JSON.parse(values.accessGroups);
                    } catch (err) {
                      toast({
                        title: 'Error',
                        description: 'Invalid JSON.',
                        status: 'error',
                        duration: 5000,
                        isClosable: true
                      });
                      return actions.setSubmitting(false);
                    }
                    user.getIdToken().then((token: string) => {
                      fetch(`/api/v1/organizations/${query.id}`, {
                        method: 'PUT',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          name: values.name,
                          description: values.description,
                          members: JSON.parse(values.members),
                          accessGroups: JSON.parse(values.accessGroups),
                          avatar: image !== organization?.avatar ? image : undefined
                        })
                      })
                        .then((res: any) => {
                          if (res.status === 200) {
                            return res.json();
                          } else {
                            return res.json().then((json: any) => {
                              throw new Error(json.message);
                            });
                          }
                        })
                        .then((data) => {
                          toast({
                            title: data.message,
                            status: 'success',
                            duration: 5000,
                            isClosable: true
                          });
                          actions.setSubmitting(false);
                          refreshData();
                        })
                        .catch((error) => {
                          toast({
                            title: 'There was an error updating the organization.',
                            description: error.message,
                            status: 'error',
                            duration: 5000,
                            isClosable: true
                          });
                        })
                        .finally(() => {
                          actions.setSubmitting(false);
                        });
                    });
                  }}
                >
                  {(props) => (
                    <Form>
                      <Portal containerRef={avatarRef}>
                        <Flex
                          id={'avatar-picker'}
                          direction={'column'}
                        >
                          <Tooltip label={'Click to change icon.'}>
                            <Avatar
                              name={organization?.name}
                              src={image || defaultImage}
                              boxSize={{ base: '6rem', md: '10rem' }}
                              borderRadius={'lg'}
                              onClick={() => {
                                avatarChooser.current?.click();
                              }}
                              cursor={'pointer'}
                              overflow={'hidden'}
                            >
                              <Flex
                                position={'absolute'}
                                w={'full'}
                                h={'full'}
                                align={'center'}
                                justify={'center'}
                                opacity={0}
                                transition={'background 0.2s ease-out, opacity 0.2s ease-out'}
                                background={'rgba(0,0,0,0.25)'}
                                color={'white'}
                                _hover={{ opacity: 1 }}
                                _active={{
                                  opacity: 1,
                                  background: 'rgba(0,0,0,0.5)'
                                }}
                              >
                                <Icon as={BsFillPencilFill} w={8} h={8} />
                              </Flex>
                            </Avatar>
                          </Tooltip>
                          <HStack
                            w={'full'}
                            align={'center'}
                            justify={'center'}
                          >
                            <Input
                              ref={avatarChooser}
                              onChange={handleChange}
                              display={'none'}
                              type={'file'}
                              accept="image/*"
                            />
                          </HStack>
                        </Flex>
                      </Portal>
                      <Field name="name">
                        {({ field, form }: any) => (
                          <FormControl isRequired>
                            <FormLabel>Name</FormLabel>
                            <InputGroup mb={2}>
                              <Input
                                {...field}
                                type="text"
                                placeholder="Organization Name"
                                variant={'outline'}
                                width={'fit-content'}
                                autoComplete={'off'}
                                autoCorrect={'off'}
                                spellCheck={'false'}
                              />
                            </InputGroup>
                          </FormControl>
                        )}
                      </Field>
                      <Field name="description">
                        {({ field, form }: any) => (
                          <FormControl>
                            <FormLabel>Description</FormLabel>
                            <InputGroup mb={2}>
                              <Textarea
                                {...field}
                                type="text"
                                autoComplete="off"
                                placeholder="Organization Description"
                                variant={'outline'}
                                minH={'96px'}
                                maxH={'240px'}
                              />
                            </InputGroup>
                          </FormControl>
                        )}
                      </Field>
                      <Stack
                        direction={{ base: 'column', md: 'row' }}
                        spacing={2}
                        py={2}
                      >
                        <Button
                          isLoading={props.isSubmitting}
                          leftIcon={<IoSave />}
                          type={'submit'}
                        >
                          Save Changes
                        </Button>
                        {organization?.self && organization.self.role >= 3 ? (
                          <Button
                            colorScheme="red"
                            mb={2}
                            onClick={onDeleteDialogOpen}
                            leftIcon={<IoIosRemoveCircle />}
                          >
                            Delete
                          </Button>
                        ) : (
                          <Button
                            colorScheme="red"
                            mb={2}
                            onClick={onLeaveDialogOpen}
                            leftIcon={<BiSolidExit />}
                          >
                            Leave Organization
                          </Button>
                        )}
                      </Stack>
                    </Form>
                  )}
                </Formik>
              </Skeleton>
            </Box>
          </Flex>
          <Flex display={{ base: 'none', md: 'flex' }} flexDir={'column'} flexBasis={1} gap={4}>
            {/* Global Stats */}
            <Box>
              <Box w={'fit-content'} my={4}>
                <Heading
                  fontSize={'3xl'}
                  w={'fit-content'}
                >
                  Statistics
                </Heading>
                <Text variant={'subtext'}>
                  Data from all of the access points in this organization.
                </Text>
              </Box>
              <Grid flexDir={{ base: 'column', md: 'row' }} templateColumns={'1fr 1fr 1fr'} gap={4}>
                <Skeleton isLoaded={!!organization}>
                  {/* <Stat label={"Total"} value={`${stats.total} scans total`} /> */}
                  <StatBox
                    label={'Total Scans'}
                    value={`${organization?.statistics?.scans?.total || 0} scan${organization?.statistics?.scans?.total === 1 ? '' : 's'}`}
                  />
                </Skeleton>
                <Skeleton isLoaded={!!organization}>
                  <StatBox
                    label={'Successful Scans'}
                    value={`${organization?.statistics?.scans?.granted || 0} scan${organization?.statistics?.scans?.total === 1 ? '' : 's'}`}
                  />
                </Skeleton>
                <Skeleton isLoaded={!!organization}>
                  <StatBox
                    label={'Failed Scans'}
                    value={`${organization?.statistics?.scans?.denied || 0} scan${organization?.statistics?.scans?.total === 1 ? '' : 's'}`}
                  />
                </Skeleton>
              </Grid>
            </Box>
            {/* Scan Events */}
            <Box>
              <Heading as="h1" size="lg">
                Scan Events
              </Heading>
              <Text fontSize={'md'} color={'gray.500'}>Showing the last 25 scan events.</Text>
            </Box>
            <Skeleton isLoaded={!!scanEvents} overflow={'auto'} overscrollBehavior={'none'} maxH={'640px'}>
              <Flex flexDir={'column'}>
                <TableContainer maxW={'container.sm'} h={'auto'}>
                  <Table maxW={'100%'} overflowX={'auto'} variant='simple' size={'sm'}>
                    <TableCaption pt={0} my={4}>
                      {
                        scanEvents?.length === 0 ? (
                          'No recent scan events found.'
                        ) : (
                          'You\'ve reached the end of the list.'
                        )
                      }
                    </TableCaption>
                    <Thead>
                      <Tr>
                        <Th textAlign={'center'}>Status</Th>
                        <Th>User</Th>
                        <Th>Access Point</Th>
                        <Th isNumeric>Date</Th>
                        <Th isNumeric>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {
                        scanEvents?.map((scanEvent: ScanEvent) => (
                          <Tr key={scanEvent.id}>
                            <Td>
                              <Tooltip label={`Access ${scanEvent.status === 'granted' ? 'Granted' : 'Denied'}`}>
                                <span>
                                  {scanEvent.status === 'granted' ? <Icon as={FaCheck} color={'#4ad66d'} w={'full'} /> : <Icon as={FaBan} color={'#db1616'} w={'full'} />}
                                </span>
                              </Tooltip>
                            </Td>
                            <Td>
                              {
                                scanEvent.user ? (
                                  <Flex flexDir={'row'} align={'center'} gap={3}>
                                    <TooltipAvatar as={Link} href={`/@${scanEvent.user.username}`} target='_blank' name={scanEvent.user.displayName} src={scanEvent.user.avatar} />
                                    <Flex flexDir={'column'}>
                                      <Text fontWeight={'bold'}>{scanEvent.user.displayName}</Text>
                                      <Text fontSize={'sm'} color={'gray.500'}>@{scanEvent.user.username}</Text>
                                    </Flex>
                                  </Flex>
                                ) : (
                                  <Flex flexDir={'row'} align={'center'} gap={4}>
                                    <TooltipAvatar as={Link} href={`https://roblox.com/users/${scanEvent.roblox.id}/profile`} target='_blank' name={scanEvent.roblox.displayName} src={scanEvent.roblox.avatar} />
                                    <Flex flexDir={'column'}>
                                      <Flex flexDir={'row'} gap={1} align={'center'}>
                                        <Icon as={SiRoblox} />
                                        <Text fontWeight={'bold'}>{scanEvent.roblox.displayName}</Text>
                                      </Flex>
                                      <Text fontSize={'sm'} color={'gray.500'}>@{scanEvent.roblox.username}</Text>
                                    </Flex>
                                  </Flex>
                                )
                              }
                            </Td>
                            <Td>
                              <Flex flexDir={'column'}>
                                <Link href={`/access-points/${scanEvent.accessPoint?.id}`} target='_blank' fontWeight={'bold'}>{scanEvent.accessPoint?.name}</Link>
                                <Link href={`/locations/${scanEvent.accessPoint?.location?.id}`} target='_blank' fontSize={'sm'} color={'gray.500'}>{scanEvent.accessPoint?.location?.name}</Link>
                              </Flex>
                            </Td>
                            <Td isNumeric>
                              <chakra.div cursor={'help'}>
                                <Tooltip label={toActualTime(scanEvent.createdAt)}>
                                  {toRelativeTime(scanEvent.createdAt)}
                                </Tooltip>
                              </chakra.div>
                            </Td>
                            <Td isNumeric>
                              <IconButton
                                size={'sm'}
                                isDisabled
                                icon={<IoEye />} aria-label={'Inspect'}                              >
                              </IconButton>
                            </Td>
                          </Tr>
                        ))
                      }
                    </Tbody>
                  </Table>
                </TableContainer>
              </Flex>
            </Skeleton>
          </Flex>
        </Flex>
      </Container >
    </>
  );
}

PlatformOrganization.getLayout = (page: any) => <Layout>{page}</Layout>;
