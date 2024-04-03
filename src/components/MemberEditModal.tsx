/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Icon,
  IconButton,
  Input,
  InputGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Portal,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Spacer,
  Stack,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  chakra,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react';

import { AiFillIdcard } from 'react-icons/ai';
import { IoIosRemoveCircle } from 'react-icons/io';
import { IoSave } from 'react-icons/io5';
import { MdEditSquare, MdPersonAdd } from 'react-icons/md';
import { RiMailAddFill, RiMailFill } from 'react-icons/ri';
import { SiRoblox, SiRobloxstudio } from 'react-icons/si';

import { AccessGroup, Organization, OrganizationMember } from '@/types';
import Editor from '@monaco-editor/react';
import { CreatableSelect, Select } from 'chakra-react-select';
import { Field, Form, Formik } from 'formik';
import moment from 'moment';

import { roleToText } from '@/lib/utils';

import { useAuthContext } from '@/contexts/AuthContext';

import DeleteDialog from '@/components/DeleteDialog';
import InviteOrganizationModal from '@/components/InviteOrganizationModal';
import InviteOrganizationRobloxGroupModal from '@/components/InviteOrganizationRobloxGroupModal';
import InviteOrganizationRobloxModal from '@/components/InviteOrganizationRobloxModal';
import { Link } from '@chakra-ui/next-js';
import InviteOrganizationFlowModal from './InviteOrganizationFlowModal';
import OrganizationInvitationsModal from './OrganizationInvitationsModal';

const ChakraEditor = chakra(Editor);
const memberTypeOrder = ['user', 'roblox', 'roblox-group', 'card'];

export default function MemberEditModal({
  isOpen,
  onOpen,
  onClose,
  onRefresh,
  clientMember,
  members,
  organization,
  onMemberRemove
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onRefresh: () => void;
  clientMember: OrganizationMember | null;
  members: Record<string, OrganizationMember>;
  organization?: Organization | null;
  onMemberRemove: (member?: OrganizationMember | null) => void;
}) {
  const { user } = useAuthContext();
  const toast = useToast();

  const themeBorderColor = useColorModeValue('gray.200', 'gray.700');
  const [filteredMembers, setFilteredMembers] = useState<OrganizationMember[] | null>(null);
  const [focusedMember, setFocusedMember] = useState<OrganizationMember | null>(null);
  const [accessGroupOptions, setAccessGroupOptions] = useState<any>(null);

  const memberSearchRef = useRef<any>(null);
  const editButtonsRef = useRef<any>(null);

  const {
    isOpen: deleteUserDialogOpen,
    onOpen: deleteUserDialogOnOpen,
    onClose: deleteUserDialogOnClose
  } = useDisclosure();

  const { isOpen: inviteModalOpen, onOpen: inviteModalOnOpen, onClose: inviteModalOnClose } = useDisclosure();
  const { isOpen: robloxModalOpen, onOpen: robloxModalOnOpen, onClose: robloxModalOnClose } = useDisclosure();
  const {
    isOpen: inviteFlowModalOpen,
    onOpen: inviteFlowModalOnOpen,
    onClose: inviteFlowModalOnClose
  } = useDisclosure();
  const {
    isOpen: invitationsModalOpen,
    onOpen: invitationsModalOnOpen,
    onClose: invitationsModalOnClose
  } = useDisclosure();

  const {
    isOpen: robloxGroupModalOpen,
    onOpen: robloxGroupModalOnOpen,
    onClose: robloxGroupModalOnClose
  } = useDisclosure();

  const filterMembers = useCallback(
    (query: string) => {
      if (!query) return Object.values(members);
      return Object.values(members).filter(
        (member: OrganizationMember) =>
          member.name?.toLowerCase().includes(query.toLowerCase()) ||
          member.displayName?.toLowerCase().includes(query.toLowerCase()) ||
          member.username?.toLowerCase().includes(query.toLowerCase()) ||
          member.groupName?.toLowerCase().includes(query.toLowerCase()) ||
          member.name?.toLowerCase().includes(query.toLowerCase())
      );
    },
    [members]
  );

  useEffect(() => {
    setFilteredMembers(Object.values(members));
  }, [members]);

  useEffect(() => {
    if (!organization) return;
    setFilteredMembers(filterMembers(memberSearchRef?.current?.value));
    getAccessGroupOptions(organization);
  }, [organization, filterMembers, focusedMember?.id]);

  const getAccessGroupType = useCallback((ag: AccessGroup) => {
    if (ag.type === 'organization') {
      return 'Organization';
    } else if (ag.type === 'location') {
      // TODO: get location name
      return ag.locationName || ag.locationId || 'Unknown';
    } else {
      return ag.type;
    }
  }, []);

  const getAccessGroupOptions = useCallback(
    (organization: Organization) => {
      if (!organization) return [];
      const ags = Object.values(organization?.accessGroups) || {};
      interface Group {
        label: string;
        options: {
          label: string;
          value: string;
        }[];
      }
      let groups = [] as any;

      ags.forEach((ag: AccessGroup) => {
        // check if the group is already in the groups object
        if (groups.find((g: Group) => g.label === getAccessGroupType(ag))) {
          // if it is, add the option to the options array
          groups
            .find((g: Group) => g.label === getAccessGroupType(ag))
            .options.push({
              label: ag.name,
              value: ag.id
            });
        } else {
          // if it's not, add the group to the groups array
          groups.push({
            label: getAccessGroupType(ag),
            options: [
              {
                label: ag.name,
                value: ag.id
              }
            ]
          });
        }
      });

      // sort the groups so organizations are at the bottom
      groups.sort((a: Group, b: Group) => {
        if (a.label === 'Organization') return 1;
        if (b.label === 'Organization') return -1;
        return 0;
      });

      setAccessGroupOptions(groups);
      return groups;
    },
    [organization]
  );

  const toRelativeTime = useMemo(
    () => (date: string) => {
      return moment(new Date(date)).fromNow();
    },
    []
  );

  const toDate = useMemo(
    () => (date: string | Date) => {
      return moment(new Date(date)).format('MMMM Do YYYY');
    },
    []
  );

  return (
    <>
      <DeleteDialog
        isOpen={deleteUserDialogOpen}
        onClose={deleteUserDialogOnClose}
        title="Remove Member"
        body={`Are you sure you want to remove ${
          focusedMember?.displayName || focusedMember?.name
        } from this organization?`}
        buttonText="Remove"
        onDelete={() => {
          deleteUserDialogOnClose();
          onMemberRemove(focusedMember);
          setFocusedMember(null);
        }}
      />
      <InviteOrganizationModal
        isOpen={inviteModalOpen}
        onOpen={inviteModalOnOpen}
        onClose={inviteModalOnClose}
        onCreate={() => {}}
        organizationId={organization?.id}
      />
      <InviteOrganizationRobloxModal
        isOpen={robloxModalOpen}
        onClose={robloxModalOnClose}
        onAdd={() => {
          onRefresh();
        }}
        organization={organization}
        accessGroupOptions={accessGroupOptions}
      />
      <InviteOrganizationRobloxGroupModal
        isOpen={robloxGroupModalOpen}
        onClose={robloxGroupModalOnClose}
        onAdd={() => {
          onRefresh();
        }}
        organization={organization}
        accessGroupOptions={accessGroupOptions}
      />
      <InviteOrganizationFlowModal
        isOpen={inviteFlowModalOpen}
        onClose={inviteFlowModalOnClose}
        onAdd={() => {
          onRefresh();
        }}
        organization={organization}
        accessGroupOptions={accessGroupOptions}
      />
      <OrganizationInvitationsModal
        isOpen={invitationsModalOpen}
        onClose={invitationsModalOnClose}
        organization={organization}
        onRefresh={onRefresh}
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        closeOnOverlayClick={false}
        blockScrollOnMount={false}
        scrollBehavior="inside"
        size={{ base: 'full', xl: 'xl' }}
      >
        <ModalOverlay />
        <ModalContent
          maxW={{ base: 'full', lg: 'container.2xl' }}
          bg={useColorModeValue('white', 'gray.800')}
          h="100%"
        >
          <ModalHeader>Manage Members</ModalHeader>
          <ModalCloseButton />
          <ModalBody
            w={'full'}
            py={0}
            h="100%"
          >
            <VStack
              w="100%"
              h="100%"
            >
              <Stack
                w="100%"
                mb={2}
                direction={{ base: 'column', md: 'row' }}
              >
                <FormControl w={{ base: 'full', md: '300px' }}>
                  <FormLabel>Search Member</FormLabel>
                  <Input
                    placeholder={'Search for a member...'}
                    ref={memberSearchRef}
                    onChange={(e) => {
                      if (e.target?.value) {
                        setFilteredMembers(filterMembers(e.target?.value));
                      } else {
                        setFilteredMembers(Object.values(members));
                      }
                    }}
                  />
                </FormControl>
                <Spacer />
                <Button
                  alignSelf={{
                    base: 'normal',
                    md: 'flex-end'
                  }}
                  onClick={inviteFlowModalOnOpen}
                  leftIcon={<MdPersonAdd />}
                  isDisabled={clientMember!?.role < 2}
                  size={{ base: 'sm', md: 'md' }}
                >
                  Add Member
                </Button>
                <Button
                  alignSelf={{
                    base: 'normal',
                    md: 'flex-end'
                  }}
                  onClick={inviteModalOnOpen}
                  leftIcon={<RiMailAddFill />}
                  isDisabled={clientMember!?.role < 2}
                  size={{ base: 'sm', md: 'md' }}
                >
                  Create Invitation Link
                </Button>
                <Button
                  alignSelf={{
                    base: 'normal',
                    md: 'flex-end'
                  }}
                  onClick={invitationsModalOnOpen}
                  leftIcon={<RiMailFill />}
                  isDisabled={clientMember!?.role < 2}
                  size={{ base: 'sm', md: 'md' }}
                >
                  View Invitations
                </Button>
              </Stack>
              <Flex
                w={'full'}
                flexGrow={1}
                h="auto"
                justify={'space-between'}
                flexDir={{ base: 'column', xl: 'row' }}
                overflow="auto"
                overscrollBehavior={'contain'}
              >
                <TableContainer
                  py={2}
                  minH={{ base: '320px', xl: '100%' }}
                  overflowY={'auto'}
                  overscrollBehavior={'contain'}
                  flexGrow={1}
                  px={4}
                >
                  <Table size={{ base: 'sm', md: 'sm' }}>
                    <Thead>
                      <Tr>
                        <Th>Member</Th>
                        <Th>Role</Th>
                        <Th isNumeric>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {organization ? (
                        Object.values(filteredMembers || {})
                          .sort(
                            (a: OrganizationMember, b: OrganizationMember) =>
                              memberTypeOrder.indexOf(a.type) - a.role - (memberTypeOrder.indexOf(b.type) - b.role)
                          )
                          .map((member: OrganizationMember) => (
                            <Tr key={member.formattedId || member.id}>
                              <Td>
                                <Flex
                                  align={'center'}
                                  my={2}
                                >
                                  <Avatar
                                    as={member.type !== 'card' ? Link : undefined}
                                    href={
                                      member.type !== 'card'
                                        ? member.type === 'user'
                                          ? `/@${member.username}`
                                          : member?.type === 'roblox'
                                          ? `https://www.roblox.com/users/${member?.id}/profile`
                                          : `https://www.roblox.com/groups/${member?.id}/group`
                                        : undefined
                                    }
                                    target="_blank"
                                    size="md"
                                    src={member.avatar}
                                    mr={4}
                                    bg={'gray.300'}
                                    borderRadius={['roblox-group', 'card'].includes(member.type) ? 'lg' : 'full'}
                                    transition={'opacity 0.2s ease-out'}
                                    _hover={{ opacity: 0.75 }}
                                    _active={{ opacity: 0.5 }}
                                  />

                                  <Flex flexDir={'column'}>
                                    {member.type === 'roblox' ? (
                                      <>
                                        <Flex
                                          flexDir={'column'}
                                          justify={'center'}
                                        >
                                          <Flex align={'center'}>
                                            <Icon
                                              size={'sm'}
                                              as={SiRoblox}
                                              mr={1}
                                            />
                                            <Text fontWeight="bold">{member.displayName}</Text>
                                          </Flex>
                                          <Text
                                            fontSize="sm"
                                            color="gray.500"
                                          >
                                            @{member?.username}
                                          </Text>
                                        </Flex>
                                      </>
                                    ) : ['roblox-group', 'card'].includes(member?.type) ? (
                                      <>
                                        <Flex align={'center'}>
                                          <Icon
                                            size={'sm'}
                                            as={member?.type === 'roblox-group' ? SiRobloxstudio : AiFillIdcard}
                                            mr={1}
                                          />
                                          <Text fontWeight="bold">{member?.name}</Text>
                                        </Flex>
                                        <Text
                                          fontSize="sm"
                                          fontWeight={'500'}
                                          color="gray.500"
                                        >
                                          {member?.type === 'roblox-group' ? member?.groupName : 'Card Number Set'}
                                        </Text>
                                      </>
                                    ) : (
                                      <>
                                        <Flex
                                          flexDir={'column'}
                                          justify={'center'}
                                        >
                                          <Flex align={'center'}>
                                            <Text fontWeight="bold">{member?.displayName}</Text>
                                          </Flex>
                                          <Text
                                            fontSize="sm"
                                            color="gray.500"
                                          >
                                            @{member?.username}
                                          </Text>
                                        </Flex>
                                      </>
                                    )}
                                    {member?.type === 'roblox-group' && (
                                      <Flex
                                        flexWrap={'wrap'}
                                        py={1}
                                        gap={1}
                                      >
                                        {!member?.groupRoles?.length && (
                                          <Badge colorScheme={'red'}>Roles Not Configured</Badge>
                                        )}
                                        {member?.groupRoles?.map((role: any) => (
                                          <Badge key={role}>
                                            {member?.roleset?.find((r: any) => r.id === role)?.name}
                                          </Badge>
                                        ))}
                                      </Flex>
                                    )}
                                    {member.type === 'card' && (
                                      <Flex
                                        flexWrap={'wrap'}
                                        py={1}
                                        gap={1}
                                      >
                                        {!member?.cardNumbers?.length && (
                                          <Badge colorScheme={'red'}>Set Not Configured</Badge>
                                        )}
                                        {member?.cardNumbers?.map((cn: any) => <Badge key={cn}>{cn}</Badge>)}
                                      </Flex>
                                    )}
                                    {member.type === 'user' && (
                                      <Text
                                        fontSize="sm"
                                        color="gray.500"
                                      >
                                        Joined {toDate(member?.joinedAt)}
                                      </Text>
                                    )}
                                  </Flex>
                                </Flex>
                              </Td>
                              <Td>{member?.type === 'user' && <Text>{roleToText(member?.role)}</Text>}</Td>
                              <Td isNumeric>
                                <Button
                                  size="sm"
                                  leftIcon={<MdEditSquare />}
                                  onClick={() => {
                                    setFocusedMember(member);
                                  }}
                                >
                                  Manage
                                </Button>
                                <IconButton
                                  aria-label="Remove Member"
                                  size="sm"
                                  colorScheme="red"
                                  ml={2}
                                  icon={<IoIosRemoveCircle />}
                                  onClick={() => {
                                    setFocusedMember(member);
                                    deleteUserDialogOnOpen();
                                  }}
                                  isDisabled={
                                    clientMember?.id === member?.id ||
                                    member?.role >= 3 ||
                                    member?.role >= clientMember!?.role
                                  }
                                />
                              </Td>
                            </Tr>
                          ))
                      ) : (
                        <>
                          {Array.from(Array(8).keys()).map((i) => (
                            <Tr key={i}>
                              <Td>
                                <Flex align={'center'}>
                                  <SkeletonCircle
                                    size="10"
                                    mr={4}
                                  />
                                  <Flex flexDir={'column'}>
                                    <SkeletonText
                                      noOfLines={2}
                                      spacing="4"
                                    />
                                  </Flex>
                                </Flex>
                              </Td>
                              <Td>
                                <SkeletonText
                                  noOfLines={1}
                                  spacing="4"
                                  skeletonHeight={4}
                                />
                              </Td>
                              <Td isNumeric>
                                <SkeletonText
                                  noOfLines={1}
                                  spacing="4"
                                  skeletonHeight={4}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </>
                      )}
                    </Tbody>
                    {Object.keys(filteredMembers || {}).length < 1 && <TableCaption>No members found.</TableCaption>}
                  </Table>
                </TableContainer>
                {/* Edit Member */}
                <Skeleton
                  isLoaded={!!organization}
                  rounded={'lg'}
                  minW={{
                    base: 'unset',
                    sm: 'unset',
                    lg: '512px'
                  }}
                  flexBasis={1}
                  h="full"
                >
                  <Flex
                    //mt={2}
                    p={6}
                    rounded={'lg'}
                    border={'1px solid'}
                    borderColor={themeBorderColor}
                    minH={{ base: '384px', xl: 'unset' }}
                    //maxH={{ base: "unset", xl: "512px" }}
                    h={'full'}
                    overflowY={'auto'}
                    overscrollBehavior={'contain'}
                  >
                    {!focusedMember || !organization ? (
                      <Text
                        m={'auto'}
                        variant={'subtext'}
                        fontWeight={'bold'}
                      >
                        Select a member to manage.
                      </Text>
                    ) : (
                      <Flex
                        flexDir={'column'}
                        w={'full'}
                      >
                        {/* Header */}
                        <Flex
                          align={'center'}
                          h={'fit-content'}
                        >
                          <Avatar
                            as={focusedMember?.type !== 'card' ? Link : undefined}
                            href={
                              focusedMember?.type !== 'card'
                                ? focusedMember?.type === 'user'
                                  ? `/@${focusedMember?.username}`
                                  : focusedMember?.type === 'roblox'
                                  ? `https://www.roblox.com/users/${focusedMember?.id}/profile`
                                  : `https://www.roblox.com/groups/${focusedMember?.id}/group`
                                : undefined
                            }
                            target="_blank"
                            size={'xl'}
                            src={focusedMember?.avatar}
                            mr={4}
                            my={2}
                            bg={'gray.300'}
                            borderRadius={['roblox-group', 'card'].includes(focusedMember?.type) ? 'lg' : 'full'}
                            transition={'opacity 0.2s ease-out'}
                            _hover={{ opacity: 0.75 }}
                            _active={{ opacity: 0.5 }}
                          />
                          <Flex flexDir={'column'}>
                            <Flex align={'center'}>
                              {focusedMember?.type?.startsWith('roblox') && (
                                <Icon
                                  size={'sm'}
                                  as={focusedMember.type === 'roblox-group' ? SiRobloxstudio : SiRoblox}
                                  mr={2}
                                  h={'full'}
                                />
                              )}
                              {focusedMember?.type === 'card' && (
                                <Icon
                                  size={'sm'}
                                  as={AiFillIdcard}
                                  mr={2}
                                  h={'full'}
                                />
                              )}
                              <Text
                                as={'h2'}
                                fontSize={'xl'}
                                fontWeight={'bold'}
                              >
                                {['roblox-group', 'card'].includes(focusedMember?.type)
                                  ? focusedMember?.name
                                  : focusedMember?.displayName}
                              </Text>
                            </Flex>
                            {focusedMember?.type === 'user' && (
                              <Text
                                fontSize={'sm'}
                                color={'gray.500'}
                              >
                                Joined {toDate(focusedMember?.joinedAt)}
                              </Text>
                            )}
                            {focusedMember?.type === 'user' && (
                              <Text
                                fontSize={'sm'}
                                color={'gray.500'}
                              >
                                {roleToText(focusedMember?.role)}
                              </Text>
                            )}
                          </Flex>
                        </Flex>
                        {/* Body */}
                        <Formik
                          enableReinitialize={true}
                          initialValues={{
                            name: ['roblox-group', 'card'].includes(focusedMember?.type)
                              ? focusedMember?.name
                              : focusedMember?.displayName,
                            role: {
                              label: roleToText(focusedMember?.role),
                              value: focusedMember?.role
                            },
                            cardNumbers: focusedMember?.cardNumbers?.map((cardNumber: string) => ({
                              label: cardNumber,
                              value: cardNumber
                            })),
                            robloxGroupRoles:
                              focusedMember?.groupRoles?.map((role: any) => ({
                                label: focusedMember?.roleset?.find((r: any) => r.id === role)?.name || 'Unknown',
                                value: role || 'Unknown'
                              })) || [],
                            accessGroups: focusedMember?.accessGroups.map(
                              (ag: string) =>
                                ({
                                  label: Object.values(organization?.accessGroups).find(
                                    (oag: AccessGroup) => oag.id === ag
                                  )?.name,
                                  value: ag
                                }) as any
                            ),
                            scanData: JSON.stringify(focusedMember?.scanData || {}, null, 3)
                          }}
                          onSubmit={(values, actions) => {
                            user.getIdToken().then((token: string) => {
                              fetch(
                                `/api/v1/organizations/${organization?.id}/members/${
                                  focusedMember?.formattedId || focusedMember?.id
                                }`,
                                {
                                  method: 'PATCH',
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    type: focusedMember?.type,
                                    name: ['roblox-group', 'card'].includes(focusedMember?.type)
                                      ? values?.name
                                      : undefined,
                                    groupRoles: values?.robloxGroupRoles?.map((role: any) => role?.value),
                                    cardNumbers:
                                      focusedMember?.type === 'card'
                                        ? values?.cardNumbers?.map((cardNumber: any) => cardNumber?.value)
                                        : undefined,
                                    role: values?.role?.value,
                                    scanData: values?.scanData || '{}',

                                    accessGroups: values?.accessGroups?.map((ag: any) => ag?.value)
                                  })
                                }
                              )
                                .then((res) => {
                                  if (res.status === 200) {
                                    return res.json();
                                  } else {
                                    return res.json().then((json) => {
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
                                  onRefresh();
                                })
                                .catch((error) => {
                                  toast({
                                    title: 'There was an error updating the member.',
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
                            <Form
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                height: '100%',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Flex
                                flexDir={'column'}
                                mt={4}
                                w={'full'}
                                pb={8}
                              >
                                <Stack>
                                  <Field name="name">
                                    {({ field, form }: any) => (
                                      <FormControl>
                                        <FormLabel>Name</FormLabel>
                                        <Input
                                          {...field}
                                          name="name"
                                          placeholder="Name"
                                          value={field?.value}
                                          isDisabled={!['roblox-group', 'card'].includes(focusedMember?.type)}
                                        />
                                      </FormControl>
                                    )}
                                  </Field>
                                  {focusedMember.type === 'roblox-group' && (
                                    <Field name="robloxGroupRoles">
                                      {({ field, form }: any) => (
                                        <FormControl>
                                          <FormLabel>Group Roles</FormLabel>
                                          <Select
                                            {...field}
                                            name="robloxGroupRoles"
                                            options={focusedMember.roleset?.map((role: any) => ({
                                              label: role.name,
                                              value: role.id
                                            }))}
                                            placeholder="Select group roles..."
                                            onChange={(value) => {
                                              form.setFieldValue('robloxGroupRoles', value);
                                            }}
                                            value={field?.value}
                                            isMulti
                                            closeMenuOnSelect={false}
                                            hideSelectedOptions={false}
                                            selectedOptionStyle={'check'}
                                          />
                                        </FormControl>
                                      )}
                                    </Field>
                                  )}
                                  {!['roblox', 'roblox-group', 'card'].includes(focusedMember.type) && (
                                    <Field name="role">
                                      {({ field, form }: any) => (
                                        <FormControl
                                          w={'fit-content'}
                                          minW={'240px'}
                                        >
                                          <FormLabel>Organization Role</FormLabel>
                                          <Select
                                            {...field}
                                            name="role"
                                            options={
                                              focusedMember.role < 3
                                                ? ['roblox', 'roblox-group'].includes(focusedMember.type)
                                                  ? [
                                                      {
                                                        label: 'Guest',
                                                        value: 1
                                                      }
                                                    ]
                                                  : [
                                                      {
                                                        label: 'Member',
                                                        value: 1
                                                      },
                                                      {
                                                        label: 'Manager',
                                                        value: 2
                                                      }
                                                    ]
                                                : [
                                                    {
                                                      label: 'Owner',
                                                      value: 3
                                                    }
                                                  ]
                                            }
                                            placeholder="Select a role..."
                                            onChange={(value) => {
                                              form.setFieldValue('role', value || ('' as string));
                                            }}
                                            value={field?.value}
                                            isDisabled={
                                              ['roblox', 'roblox-group'].includes(focusedMember.type) ||
                                              focusedMember.role === 3 ||
                                              focusedMember === clientMember
                                            }
                                            hideSelectedOptions={false}
                                            selectedOptionStyle={'check'}
                                          />
                                        </FormControl>
                                      )}
                                    </Field>
                                  )}
                                  {focusedMember.type === 'card' && (
                                    <Field name="cardNumbers">
                                      {({ field, form }: any) => (
                                        <FormControl>
                                          <FormLabel>Card Numbers</FormLabel>
                                          <CreatableSelect
                                            {...field}
                                            variant={'outline'}
                                            options={[]}
                                            onChange={(value) => {
                                              form.setFieldValue('cardNumbers', value);
                                            }}
                                            value={field.value || []}
                                            placeholder="Enter card numbers..."
                                            isMulti
                                            closeMenuOnSelect={false}
                                            hideSelectedOptions={false}
                                            selectedOptionStyle="check"
                                          />
                                          <FormHelperText>
                                            These are the card numbers that will be assigned to this member.
                                          </FormHelperText>
                                        </FormControl>
                                      )}
                                    </Field>
                                  )}
                                  <Field name="accessGroups">
                                    {({ field, form }: any) => (
                                      <FormControl>
                                        <FormLabel>Access Groups</FormLabel>
                                        <Select
                                          {...field}
                                          name="accessGroups"
                                          options={accessGroupOptions || []}
                                          placeholder="Select an access group..."
                                          onChange={(value) => {
                                            form.setFieldValue('accessGroups', value);
                                          }}
                                          value={field?.value}
                                          isMulti
                                          closeMenuOnSelect={false}
                                          selectedOptionStyle={'check'}
                                          hideSelectedOptions={false}
                                        />
                                        <FormHelperText>
                                          Enter the access groups that this member has access to.
                                        </FormHelperText>
                                      </FormControl>
                                    )}
                                  </Field>
                                  <Field name="scanData">
                                    {({ field, form }: any) => (
                                      <FormControl w={'full'}>
                                        <FormLabel>Scan Data</FormLabel>
                                        <InputGroup>
                                          <Box
                                            border={'1px solid'}
                                            borderColor={themeBorderColor}
                                            borderRadius={'lg'}
                                            w={'full'}
                                            overflow={'hidden'}
                                          >
                                            <ChakraEditor
                                              {...field}
                                              height="240px"
                                              width="100%"
                                              p={4}
                                              language="json"
                                              theme={useColorModeValue('vs-light', 'vs-dark')}
                                              options={{
                                                minimap: {
                                                  enabled: false
                                                }
                                              }}
                                              value={form.values?.scanData}
                                              onChange={(value) => {
                                                form.setFieldValue('scanData', value);
                                              }}
                                            />
                                          </Box>
                                        </InputGroup>
                                        <FormHelperText>
                                          This is the data that will be returned when this member scans their card.
                                          (User scan data takes priority over access group scan data when it is merged).
                                        </FormHelperText>
                                      </FormControl>
                                    )}
                                  </Field>
                                </Stack>
                              </Flex>

                              <Portal containerRef={editButtonsRef}>
                                <Stack
                                  direction={'row'}
                                  spacing={4}
                                >
                                  <Button
                                    isLoading={props.isSubmitting}
                                    leftIcon={<IoSave />}
                                    type={'submit'}
                                    onClick={() => {
                                      props.handleSubmit();
                                    }}
                                    onSubmit={() => {
                                      props.handleSubmit();
                                    }}
                                  >
                                    Save Changes
                                  </Button>
                                  <Button
                                    colorScheme="red"
                                    leftIcon={<IoIosRemoveCircle />}
                                    onClick={() => {
                                      setFocusedMember(focusedMember);
                                      deleteUserDialogOnOpen();
                                    }}
                                    isDisabled={
                                      clientMember?.id === focusedMember?.id ||
                                      focusedMember?.role >= 3 ||
                                      focusedMember?.role >= clientMember!?.role
                                    }
                                  >
                                    Remove
                                  </Button>
                                </Stack>
                              </Portal>
                            </Form>
                          )}
                        </Formik>
                      </Flex>
                    )}
                  </Flex>
                </Skeleton>
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Stack
              direction={{ base: 'column', md: 'row' }}
              pt={{ base: 2, md: 0 }}
              spacing={4}
            >
              <Box ref={editButtonsRef} />
              <Button
                colorScheme={'black'}
                onClick={onClose}
              >
                Close
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
