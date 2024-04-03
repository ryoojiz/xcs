/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
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
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Portal,
  Skeleton,
  SkeletonText,
  Spacer,
  Stack,
  Switch,
  Table, TableCaption, TableContainer, Tbody, Td, Text,
  Th, Thead,
  Tr,
  VStack,
  chakra,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react';


import { IoIosCreate, IoIosRemoveCircle } from 'react-icons/io';
import { IoSave } from 'react-icons/io5';
import { MdEditSquare } from 'react-icons/md';

import Editor from '@monaco-editor/react';
import { Field, Form, Formik } from 'formik';


import { useAuthContext } from '@/contexts/AuthContext';

import DeleteDialog from '@/components/DeleteDialog';

import CreateAccessGroupDialog from './CreateAccessGroupDialog';

const ChakraEditor = chakra(Editor);

export default function AccessGroupEditModal({
  isOpen,
  onOpen,
  onClose,
  onRefresh,
  clientMember,
  groups,
  organization,
  location,
  onGroupRemove
}: any) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [focusedGroup, setFocusedGroup] = useState<any>(null);
  const themeBorderColor = useColorModeValue('gray.200', 'gray.700');

  const groupSearchRef = useRef<any>(null);
  const [filteredGroups, setFilteredGroups] = useState<any>([]);

  const editButtonsRef = useRef<any>(null);

  const {
    isOpen: deleteGroupDialogOpen,
    onOpen: deleteGroupDialogOnOpen,
    onClose: deleteGroupDialogOnClose
  } = useDisclosure();

  const { isOpen: createModalOpen, onOpen: createModalOnOpen, onClose: createModalOnClose } = useDisclosure();

  const filterGroups = useCallback((query: string) => {
    if (!query) return groups;
    return Object.keys(groups)
      .filter((group: any) => groups[group].name.toLowerCase().includes(query.toLowerCase()))
      .map((group: any) => groups[group]);
  }, [groups]);

  useEffect(() => {
    setFilteredGroups(groups || {});
  }, [groups]);

  useEffect(() => {
    if (!organization) return;
    setFilteredGroups(filterGroups(groupSearchRef?.current?.value));
    if (focusedGroup) {
      setFocusedGroup(Object.values(groups as any).find((group: any) => group.id === focusedGroup.id));
    }
  }, [organization]);

  return (
    <>
      <DeleteDialog
        isOpen={deleteGroupDialogOpen}
        onClose={deleteGroupDialogOnClose}
        title="Delete Access Group"
        body={`Are you sure you want to delete the ${focusedGroup?.name} access group from this organization? All members and access points that have this access group will be updated to reflect this change.`}
        buttonText="Delete"
        onDelete={() => {
          deleteGroupDialogOnClose();
          onGroupRemove(focusedGroup);
          setFocusedGroup(null);
        }}
      />
      <CreateAccessGroupDialog
        isOpen={createModalOpen}
        onClose={createModalOnClose}
        organization={organization}
        location={location}
        onCreate={(group: any) => {
          onRefresh();
          createModalOnClose();
        }}
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        closeOnOverlayClick={false}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent
          maxW={{ base: 'full', lg: 'container.xl' }}
          bg={useColorModeValue('white', 'gray.800')}
          h="100%"
        >
          <ModalHeader>Manage Access Groups</ModalHeader>
          <ModalCloseButton />
          <ModalBody
            w={'full'}
            pb={0}
            h="100%"
          >
            <VStack
              w="100%"
              h="100%"
              overflow={{
                base: 'auto',
                xl: 'hidden'
              }}
              overscrollBehavior={'contain'}
            >
              <Stack
                w="100%"
                mb={4}
                direction={{ base: 'column', md: 'row' }}
              >
                <FormControl w={{ base: 'full', md: '300px' }}>
                  <FormLabel>Search Access Group</FormLabel>
                  <Input
                    placeholder={'Search for an access group...'}
                    ref={groupSearchRef}
                    onChange={(e) => {
                      if (e.target?.value) {
                        setFilteredGroups(filterGroups(e.target?.value));
                      } else {
                        setFilteredGroups(groups);
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
                  onClick={createModalOnOpen}
                  leftIcon={<IoIosCreate />}
                >
                  New Access Group
                </Button>
              </Stack>
              <Flex
                w={'full'}
                justify={'space-between'}
                flexDir={{ base: 'column', xl: 'row' }}
                h="full"
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
                        <Th>Name</Th>
                        <Th isNumeric>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {organization ? (
                        Object.keys(filteredGroups).map((group: any) => (
                          <Tr key={group}>
                            <Td>
                              <Box my={2}>
                                <Text
                                  fontWeight="bold"
                                  alignItems={'center'}
                                  display={'flex'}
                                >
                                  {filteredGroups[group].name}
                                  {filteredGroups[group].config?.openToEveryone && (
                                    <Badge
                                      as={'span'}
                                      ml={2}
                                    >
                                      Everyone
                                    </Badge>
                                  )}
                                  <Badge
                                    as={'span'}
                                    ml={2}
                                    colorScheme={filteredGroups[group].config?.active ? 'green' : 'red'}
                                  >
                                    {filteredGroups[group].config?.active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </Text>
                                {filteredGroups[group].description && (
                                  <Text
                                    color={'gray.500'}
                                    maxW={'384px'}
                                    isTruncated
                                  >
                                    {filteredGroups[group].description}
                                  </Text>
                                )}
                              </Box>
                            </Td>
                            <Td isNumeric>
                              <Button
                                size="sm"
                                leftIcon={<MdEditSquare />}
                                onClick={() => {
                                  setFocusedGroup(filteredGroups[group]);
                                }}
                              >
                                Manage
                              </Button>
                              <IconButton
                                aria-label="Delete Access Group"
                                size="sm"
                                colorScheme="red"
                                ml={2}
                                icon={<IoIosRemoveCircle />}
                                onClick={() => {
                                  setFocusedGroup(filteredGroups[group]);
                                  deleteGroupDialogOnOpen();
                                }}
                              />
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <>
                          {Array.from(Array(8).keys()).map((i) => (
                            <Tr key={i}>
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
                    {(!Object.keys(groups || {})?.length || !Object.keys(filteredGroups || {})?.length) && (
                      <TableCaption>No access groups found.</TableCaption>
                    )}
                  </Table>
                </TableContainer>
                {/* Edit Group */}
                <Skeleton
                  isLoaded={organization}
                  rounded={'lg'}
                  minW={{
                    base: 'unset',
                    sm: 'unset',
                    lg: '512px'
                  }}
                  flexBasis={1}
                >
                  <Flex
                    p={6}
                    rounded={'lg'}
                    border={'1px solid'}
                    borderColor={themeBorderColor}
                    h={'full'}
                    overflowY={'auto'}
                    overscrollBehavior={'contain'}
                  >
                    {!focusedGroup || !organization ? (
                      <Text
                        m={'auto'}
                        variant={'subtext'}
                        fontWeight={'bold'}
                      >
                        Select an access group to manage.
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
                          <Flex flexDir={'column'}>
                            <Flex align={'center'}>
                              <Text
                                as={'h2'}
                                fontSize={'2xl'}
                                fontWeight={'bold'}
                              >
                                {focusedGroup?.name}
                              </Text>
                            </Flex>
                          </Flex>
                        </Flex>
                        {/* Body */}
                        <Formik
                          enableReinitialize={true}
                          initialValues={{
                            name: focusedGroup?.name,
                            description: focusedGroup?.description || '',
                            priority: focusedGroup?.priority || 1,
                            scanData: JSON.stringify(focusedGroup?.scanData, null, 3),
                            // config
                            configActive: focusedGroup?.config?.active,
                            configOpenToEveryone: focusedGroup?.config?.openToEveryone
                          }}
                          onSubmit={(values, actions) => {
                            user.getIdToken().then((token: string) => {
                              fetch(`/api/v1/organizations/${organization?.id}/access-groups/${focusedGroup?.id}`, {
                                method: 'PATCH',
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                  name: values?.name,
                                  locationId: location?.id,
                                  description: values?.description,
                                  scanData: values?.scanData,
                                  priority: values?.priority,
                                  config: {
                                    active: values?.configActive,
                                    openToEveryone: values?.configOpenToEveryone
                                  }
                                })
                              })
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
                                    title: 'There was an error updating the access group.',
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
                                  <Stack
                                    direction={{
                                      base: 'column',
                                      md: 'column'
                                    }}
                                  >
                                    <Field name="name">
                                      {({ field, form }: any) => (
                                        <FormControl w={'fit-content'}>
                                          <FormLabel>Name</FormLabel>
                                          <Input
                                            {...field}
                                            type={'text'}
                                            variant={'outline'}
                                            placeholder={'Access Group Name'}
                                            autoComplete={'off'}
                                            autoCorrect={'off'}
                                          />
                                        </FormControl>
                                      )}
                                    </Field>
                                    <Field name="description">
                                      {({ field, form }: any) => (
                                        <FormControl>
                                          <FormLabel>Short Description</FormLabel>
                                          <Input
                                            {...field}
                                            type={'text'}
                                            variant={'outline'}
                                            placeholder={'Short Description'}
                                            autoComplete={'off'}
                                            autoCorrect={'off'}
                                          />
                                        </FormControl>
                                      )}
                                    </Field>
                                    <Field name="priority">
                                      {({ field, form }: any) => (
                                        <FormControl w={'fit-content'}>
                                          <FormLabel>Priority</FormLabel>
                                          <InputGroup>
                                            <NumberInput
                                              {...field}
                                              autoComplete="off"
                                              placeholder="Priority"
                                              variant={'outline'}
                                              min={1}
                                              defaultValue={1}
                                              onChange={(value) => {
                                                form.setFieldValue('priority', value);
                                              }}
                                            >
                                              <NumberInputField />
                                              <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                              </NumberInputStepper>
                                            </NumberInput>
                                          </InputGroup>
                                        </FormControl>
                                      )}
                                    </Field>
                                  </Stack>
                                  <Stack
                                    direction={{
                                      base: 'column',
                                      md: 'row'
                                    }}
                                    py={2}
                                    w={'fit-content'}
                                  >
                                    <Field name="configActive">
                                      {({ field, form }: any) => (
                                        <FormControl w={'fit-content'}>
                                          <FormLabel>Active</FormLabel>
                                          <InputGroup>
                                            <Switch
                                              {...field}
                                              placeholder="Active"
                                              variant={'outline'}
                                              width={'fit-content'}
                                              isChecked={form.values?.configActive}
                                              onChange={(e) => {
                                                form.setFieldValue('configActive', e.target.checked);
                                              }}
                                            />
                                          </InputGroup>
                                          <FormHelperText>Whether or not this access group is active.</FormHelperText>
                                        </FormControl>
                                      )}
                                    </Field>
                                    <Field name="configOpenToEveryone">
                                      {({ field, form }: any) => (
                                        <FormControl w={'fit-content'}>
                                          <FormLabel>Everyone</FormLabel>
                                          <InputGroup>
                                            <Switch
                                              {...field}
                                              colorScheme={'red'}
                                              placeholder="Everyone"
                                              variant={'outline'}
                                              width={'fit-content'}
                                              isChecked={form.values?.configOpenToEveryone}
                                              onChange={(e) => {
                                                form.setFieldValue('configOpenToEveryone', e.target.checked);
                                              }}
                                            />
                                          </InputGroup>
                                          <FormHelperText>
                                            Whether or not this access group is open to everyone whose access is granted.
                                          </FormHelperText>
                                        </FormControl>
                                      )}
                                    </Field>
                                  </Stack>
                                  <Field name="scanData">
                                    {({ field, form }: any) => (
                                      <FormControl w={'fit-content'}>
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
                                          This is the data that will be returned when a user under this access group
                                          scans their card. (User scan data takes priority over access group scan data
                                          when it is merged).
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
                                      setFocusedGroup(focusedGroup);
                                      deleteGroupDialogOnOpen();
                                    }}
                                  >
                                    Delete
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
              spacing={4}
            >
              <Box ref={editButtonsRef} />
              <Button
                colorScheme="black"
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
