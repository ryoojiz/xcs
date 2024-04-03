/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  RadioGroup,
  Spacer,
  Stack,
  Step,
  StepIcon,
  StepIndicator,
  StepSeparator,
  StepStatus,
  Stepper,
  Text,
  chakra,
  useColorModeValue,
  useRadio,
  useRadioGroup,
  useSteps,
  useToast
} from '@chakra-ui/react';

import { AsyncSelect, CreatableSelect, Select } from 'chakra-react-select';
import { Field, Form, Formik } from 'formik';

import { useAuthContext } from '@/contexts/AuthContext';
import { AiFillIdcard } from 'react-icons/ai';
import { FaIdBadge } from 'react-icons/fa';
import { SiRoblox, SiRobloxstudio } from 'react-icons/si';

const steps = [
  { description: 'Choose a Member Type' },
  { description: 'Enter Member Details' },
  { description: 'Completed' },
]

interface SelectOption {
  label?: string;
  value: string | number;
}

function RadioCard(props: any) {
  const { getInputProps, getRadioProps } = useRadio(props as any)

  const input = getInputProps()
  const checkbox = getRadioProps()

  return (
    <Box as='label'>
      <input {...input} />
      <Box
        {...checkbox}
        cursor='pointer'
        borderWidth='1px'
        borderRadius='lg'
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        transition={'background 0.2s ease-out'}
        _hover={{
          bg: useColorModeValue('gray.50', 'gray.700'),
        }}
        _checked={{
          bg: useColorModeValue('gray.100', 'gray.700'),
        }}
        _active={{
          bg: useColorModeValue('gray.200', 'gray.600'),
        }}
        // _focus={{
        //   boxShadow: 'outline',
        // }}
        px={5}
        py={3}
      >
        {props.children}
      </Box>
    </Box>
  )
}


export default function InviteOrganizationFlowModal({
  isOpen,
  onClose,
  onAdd,
  organization,
  accessGroupOptions
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  organization: any;
  accessGroupOptions: any;
}) {
  const toast = useToast();
  const initialRef = useRef(null);
  const finalRef = useRef(null);
  const formRef = useRef(null) as any;
  const [groupRoles, setGroupRoles] = useState<any>([]);
  const [lastGroupId, setLastGroupId] = useState<any>('');
  const groupIdRef = useRef<any>(null);
  const { user } = useAuthContext();
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })
  const activeStepText = steps[activeStep].description

  const memberTypeOptions = [
    {
      icon: FaIdBadge,
      value: 'user',
      label: 'User',
      description: 'A registered user on the XCS platform.'
    },
    {
      icon: SiRoblox,
      value: 'roblox',
      label: 'Roblox User',
      description: 'A Roblox user.'
    },
    {
      icon: SiRobloxstudio,
      value: 'roblox-group',
      label: 'Roblox Group',
      description: 'A Roblox group with roles (member, staff, etc.)'
    },
    {
      icon: AiFillIdcard,
      value: 'card',
      label: 'Card Numbers',
      description: 'A set of card numbers.'
    }
  ]

  useEffect(() => {
    if (activeStep === 0) {
      // reset form
      const preserveType = formRef.current.values.type;
      formRef.current.resetForm();
      formRef.current.setFieldValue('type', preserveType);
    }
  }, [activeStep])

  const { setValue: setRadioMemberType, getRadioProps: getRadioPropsMemberType } = useRadioGroup({
    name: 'memberType',
    defaultValue: 'user',
    onChange: (value) => {
      if (!formRef.current) return;
      formRef.current.setFieldValue('type', value)
    }
  })

  const getUserSearchResults = useCallback(async (inputValue: string, callback: any) => {
    if (!inputValue) {
      callback([]);
      return;
    }
    await user.getIdToken().then((token: any) => {
      fetch(`/api/v1/platform/search-users/${encodeURIComponent(inputValue)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
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
          callback(
            data.map((user: any) => ({
              label: `${user.displayName} (${user.username})`,
              value: user.id
            }))
          );
        })
        .catch((error) => {
          // toast({
          //   title: 'There was an error searching for users.',
          //   description: error.message,
          //   status: 'error',
          //   duration: 5000,
          //   isClosable: true
          // });
        });
    });
  }, [user]);

  const getGroupSearchResults = useCallback((value: string, callback: any) => {
    user.getIdToken().then((token: any) => {
      fetch(`/api/v1/roblox/group-search/${encodeURIComponent(value)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
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
          let options = [] as any;
          data.forEach((group: any) => {
            options.push({
              label: group.name,
              value: group.id
            });
          });
          callback(options);
        })
        .catch((error) => {
          toast({
            title: 'There was an error fetching Roblox group search results.',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true
          });
          callback([]);
        });
    });
  }, [user, toast]);

  const fetchGroupRoles = useCallback((groupId: any) => {
    groupId = groupId?.value;
    setGroupRoles([]);
    if (!groupId) return;
    user.getIdToken().then((token: any) => {
      fetch(`/api/v1/roblox/group-roles/${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
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
          setGroupRoles(
            data.map((role: any) => {
              return {
                label: role.name,
                value: role.id
              };
            })
          );
          if (lastGroupId !== groupId) {
            formRef.current.setFieldValue('robloxGroupRoles', []);
          }
          toast({
            title: 'Successfully fetched group roles.',
            status: 'success',
            duration: 5000,
            isClosable: true
          });
          setLastGroupId(groupId);
        })
        .catch((error) => {
          toast({
            title: 'There was an error fetching Roblox group roles.',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        });
    });
  }, [user, toast, lastGroupId]);

  return (
    <>
      <Formik
        innerRef={formRef}
        enableReinitialize={true}
        initialValues={{
          type: 'user',
          name: '',
          role: { label: 'Member', value: 1 } as SelectOption,
          id: null as
            | SelectOption
            | any,
          username: '',
          accessGroups: [],
          cardNumbers: [] as SelectOption[],
          robloxGroupId: null as any,
          robloxGroupRoles: []
        }}
        onSubmit={(values, actions) => {
          let finalBody = {} as any;

          switch (values.type) {
            case 'user':
              finalBody = {
                type: values.type,
                id: values.id?.value,
                role: values.role?.value,
                accessGroups: values?.accessGroups?.map((ag: any) => ag?.value)
              };
              break;
            case 'roblox':
              finalBody = {
                type: values.type,
                username: values.username,
                accessGroups: values?.accessGroups?.map((ag: any) => ag?.value)
              };
              break;
            case 'roblox-group':
              finalBody = {
                type: values.type,
                name: values.name,
                robloxGroupId: values.robloxGroupId?.value,
                robloxGroupRoles: values.robloxGroupRoles.map((r: any) => r.value),
                accessGroups: values?.accessGroups?.map((ag: any) => ag?.value)
              };
              break;
            case 'card':
              finalBody = {
                type: values.type,
                name: values.name,
                cardNumbers: values?.cardNumbers?.map((cn: any) => cn?.value),
                accessGroups: values?.accessGroups?.map((ag: any) => ag?.value)
              };
              break;
          }

          user.getIdToken().then((token: any) => {
            fetch(`/api/v1/organizations/${organization.id}/members`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(finalBody)
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
                onClose();
                onAdd();
                // actions.resetForm();
                // setActiveStep(0);
                // setRadioMemberType('user');
              })
              .catch((error) => {
                toast({
                  title: 'There was an error adding a member to your organization.',
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
          <Modal
            isOpen={isOpen}
            onClose={onClose}
            isCentered
            allowPinchZoom
            closeOnOverlayClick={false}
            onCloseComplete={() => {
              props.resetForm();
              setActiveStep(0);
              setRadioMemberType('user');
            }}
            size={'lg'}
          >
            <ModalOverlay />
            <Form>
              <ModalContent bg={useColorModeValue('white', 'gray.800')}>
                <ModalHeader>
                  Add Member
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody minH={'xl'}>
                  <Stack gap={0} py={2}>
                    <Stepper size='sm' index={activeStep} gap='0' colorScheme='black'>
                      {steps.map((step, index) => (
                        <Step as={chakra.div} key={index} gap={0}>
                          <StepIndicator>
                            <StepStatus complete={<StepIcon />} />
                          </StepIndicator>
                          <StepSeparator as={chakra.div} _horizontal={{ ml: '0' }} />
                        </Step>
                      ))}
                    </Stepper>
                    <Text fontSize={'xl'} pt={4}>
                      Step {activeStep + 1}: <b>{activeStepText}</b>
                    </Text>
                    <Text variant={'subtext'} fontSize={'sm'}>
                      {
                        activeStep === 0 && (
                          'Choose the type of member you want to add to your organization.'
                        )
                      }
                      {
                        activeStep === 1 && (
                          'Enter the details for the member you want to add to your organization.'
                        )
                      }
                      {
                        activeStep === 2 && (
                          'Review your member details before adding them to your organization.'
                        )
                      }
                    </Text>
                  </Stack>
                  <Flex py={4} w={'full'}>
                    {
                      activeStep === 0 && (
                        <Field name="type">
                          {({ field, form }: any) => (
                            <Flex flexDir={'row'} gap={4} w={'full'}>
                              <RadioGroup {...field} defaultValue="user" dir='column' value={field.value} w={'full'}>
                                <Stack spacing={2}>
                                  {memberTypeOptions.map((value: any) => {
                                    const radio = getRadioPropsMemberType({ value: value.value })
                                    return (
                                      <RadioCard key={value.value} {...radio}>
                                        <Flex flexDir={'row'} align={'center'} justify={'flex-start'}>
                                          <Icon as={value.icon} w={5} h={5} />
                                          <Flex flexDir={'column'} ml={4}>
                                            <Text fontWeight={'bold'}>
                                              {value.label}
                                            </Text>
                                            <Text fontSize={'sm'} color={'gray.500'}>
                                              {value.description}
                                            </Text>
                                          </Flex>
                                        </Flex>
                                      </RadioCard>
                                    )
                                  })}
                                </Stack>
                              </RadioGroup>
                            </Flex>
                          )}
                        </Field>
                      )
                    }
                    {
                      activeStep === 1 && (
                        <Flex flexDir={'column'} gap={2} w={'full'}>
                          {
                            props.values.type && (
                              <>
                                {props.values.type === 'user' &&
                                  <Field name="id">
                                    {({ field, form }: any) => (
                                      <FormControl minW={'196px'} w={'fit-content'}>
                                        <FormLabel>User</FormLabel>
                                        <AsyncSelect
                                          {...field}
                                          name="User"
                                          options={[]}
                                          placeholder="Search for a user..."
                                          isMulti={false}
                                          closeMenuOnSelect={true}
                                          isClearable={true}
                                          size="md"
                                          noOptionsMessage={() => 'No search results found.'}
                                          loadOptions={(inputValue, callback) => {
                                            getUserSearchResults(inputValue, callback);
                                          }}
                                          onChange={(value) => {
                                            form.setFieldValue('id', value);
                                          }}
                                          value={field.value || []}
                                        />
                                        <FormHelperText>
                                          Enter the user you want to add to your organization.
                                        </FormHelperText>
                                      </FormControl>
                                    )}
                                  </Field>}
                                {props.values.type === 'roblox' &&
                                  <Field name="username">
                                    {({ field, form }: any) => (
                                      <FormControl>
                                        <FormLabel>Username</FormLabel>
                                        <Input
                                          {...field}
                                          type={'username'}
                                          variant={'outline'}
                                          placeholder={'Roblox Username'}
                                          autoComplete={'off'}
                                          autoCorrect={'off'}
                                          spellCheck={'false'}
                                        />
                                      </FormControl>
                                    )}
                                  </Field>
                                }
                                {
                                  props.values.type === 'roblox-group' &&
                                  <>
                                    <Field name="name">
                                      {({ field, form }: any) => (
                                        <FormControl>
                                          <FormLabel>Name</FormLabel>
                                          <Input
                                            {...field}
                                            type={'username'}
                                            variant={'outline'}
                                            placeholder={'Name'}
                                            autoComplete={'off'}
                                            autoCorrect={'off'}
                                            spellCheck={'false'}
                                          />
                                          <FormHelperText>
                                            Enter the name you want to give to the group that&apos;s easy to distinguish.
                                          </FormHelperText>
                                        </FormControl>
                                      )}
                                    </Field>
                                    <Stack
                                      direction={{ base: 'column', md: 'column' }}
                                      w={'full'}
                                    >
                                      <Field name="robloxGroupId">
                                        {({ field, form }: any) => (
                                          <FormControl>
                                            <FormLabel>Group</FormLabel>
                                            <AsyncSelect
                                              {...field}
                                              name="robloxGroupId"
                                              ref={groupIdRef}
                                              options={[]}
                                              placeholder="Search for a group..."
                                              isMulti={false}
                                              closeMenuOnSelect={true}
                                              isClearable={true}
                                              size="md"
                                              noOptionsMessage={() => 'No search results found.'}
                                              loadOptions={(inputValue, callback) => {
                                                getGroupSearchResults(inputValue, callback);
                                              }}
                                              onChange={(value) => {
                                                form.setFieldValue('robloxGroupId', value);
                                                fetchGroupRoles(value);
                                              }}
                                              value={field.value || []}
                                            />
                                          </FormControl>
                                        )}
                                      </Field>
                                      <Field name="robloxGroupRoles">
                                        {({ field, form }: any) => (
                                          <FormControl>
                                            <FormLabel>Group Roles</FormLabel>
                                            <Select
                                              {...field}
                                              variant={'outline'}
                                              options={groupRoles}
                                              onChange={(value) => {
                                                form.setFieldValue('robloxGroupRoles', value);
                                              }}
                                              value={field.value || []}
                                              placeholder="Select group roles..."
                                              isMulti
                                              closeMenuOnSelect={false}
                                              hideSelectedOptions={false}
                                              selectedOptionStyle="check"
                                            />
                                          </FormControl>
                                        )}
                                      </Field>
                                    </Stack>
                                  </>
                                }
                                {
                                  props.values.type === 'card' && (
                                    <>
                                      <Field name="name">
                                        {({ field, form }: any) => (
                                          <FormControl>
                                            <FormLabel>Name</FormLabel>
                                            <Input
                                              {...field}
                                              type={'username'}
                                              variant={'outline'}
                                              placeholder={'Name'}
                                              autoComplete={'off'}
                                              autoCorrect={'off'}
                                              spellCheck={'false'}
                                            />
                                            <FormHelperText>
                                              Enter the name you want to give to the group that&apos;s easy to distinguish.
                                            </FormHelperText>
                                          </FormControl>
                                        )}
                                      </Field>
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
                                              Enter the card numbers you want to add to your organization. <Text as={'strong'}>Ranges are supported (e.g. 1-24).</Text>
                                            </FormHelperText>
                                          </FormControl>
                                        )}
                                      </Field>
                                    </>
                                  )
                                }
                                {
                                  props.values.type === 'user' && (
                                    <Field name="role">
                                      {({ field, form }: any) => (
                                        <FormControl>
                                          <FormLabel>Organization Role</FormLabel>
                                          <Select
                                            {...field}
                                            variant={'outline'}
                                            options={[
                                              { label: 'Member', value: 1 },
                                              { label: 'Manager', value: 2 }
                                            ]}
                                            onChange={(value) => {
                                              form.setFieldValue('role', value);
                                            }}
                                            value={field.value}
                                            placeholder="Select a role..."
                                            single={true}
                                            hideSelectedOptions={false}
                                            selectedOptionStyle={'check'}
                                            isDisabled={props.values.type !== 'user'}
                                          />
                                          <FormHelperText>
                                            {
                                              props.values.type === 'user' ? (
                                                'Select the role you want to give to the user.'
                                              ) : (
                                                'You cannot select a role for this member type.'
                                              )
                                            }
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
                                        variant={'outline'}
                                        options={accessGroupOptions}
                                        onChange={(value) => {
                                          form.setFieldValue('accessGroups', value);
                                        }}
                                        value={field.value || []}
                                        placeholder="Select an access group..."
                                        isMulti
                                        closeMenuOnSelect={false}
                                        hideSelectedOptions={false}
                                        selectedOptionStyle={'check'}
                                      />
                                      <FormHelperText>
                                        Select the access groups you want to give to this member type.
                                      </FormHelperText>
                                    </FormControl>
                                  )}
                                </Field>
                              </>
                            )
                          }
                        </Flex>
                      )
                    }
                    {/* {
                      activeStep === 2 && (
                        <Flex flexDir={'column'} p={4} w={'full'} border={'1px solid'} borderColor={useColorModeValue('gray.200', 'gray.700')} borderRadius={'lg'}>
                          <Heading as={'h3'} fontSize={'xl'} fontWeight={'bold'} pb={2}>
                            Member Type
                          </Heading>
                          <Flex flexDir={'row'} gap={2} align={'center'}>
                            <Icon as={memberTypeOptions.find((mto: any) => mto.value === props.values.type)?.icon} w={5} h={5} />
                            <Flex flexDir={'column'} ml={3}>
                              <Text fontWeight={'bold'}>
                                {memberTypeOptions.find((mto: any) => mto.value === props.values.type)?.label}
                              </Text>
                              <Text fontSize={'sm'} color={'gray.500'}>
                                {memberTypeOptions.find((mto: any) => mto.value === props.values.type)?.description}
                              </Text>
                            </Flex>
                          </Flex>
                          <Heading as={'h3'} fontSize={'xl'} fontWeight={'bold'} pt={4} pb={2}>
                            Member Details
                          </Heading>
                          {
                            props.values.type === 'user' && (
                              <>
                                <Flex flexDir={'row'} gap={2} align={'center'}>
                                  <Icon as={FaIdBadge} w={5} h={5} />
                                  <Flex flexDir={'column'} ml={3}>
                                    <Text fontWeight={'bold'}>
                                      {props.values.id?.label}
                                    </Text>
                                    <Text fontSize={'sm'} color={'gray.500'}>
                                      {props.values.id?.value}
                                    </Text>
                                  </Flex>
                                </Flex>
                                <Flex flexDir={'row'} gap={2} align={'center'} pt={2}>
                                  <Icon as={AiFillIdcard} w={5} h={5} />
                                  <Flex flexDir={'column'} ml={3}>
                                    <Text fontWeight={'bold'}>
                                      {props.values.role?.label}
                                    </Text>
                                    <Text fontSize={'sm'} color={'gray.500'}>
                                      {props.values.role?.value}
                                    </Text>
                                  </Flex>
                                </Flex>
                              </>
                            )
                          }
                          {
                            props.values.type === 'roblox' && (
                              <>
                                <Flex flexDir={'row'} gap={2} align={'center'}>
                                  <Flex flexDir={'column'}>
                                    <Text variant={'subtext'}>Roblox Username</Text>
                                    <Text fontWeight={'bold'}>
                                      {props.values.username}
                                    </Text>
                                  </Flex>
                                </Flex>
                              </>
                            )
                          }
                        </Flex>
                      )
                    } */}
                  </Flex>


                  {/* <VStack spacing={2}> */}
                  {/* <Field name="username">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Username</FormLabel>
                          <Input
                            {...field}
                            type={'username'}
                            variant={'outline'}
                            placeholder={'Roblox Username'}
                            autoComplete={'off'}
                            autoCorrect={'off'}
                            spellCheck={'false'}
                          />
                        </FormControl>
                      )}
                    </Field>
                    <Field name="accessGroups">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Access Groups</FormLabel>
                          <Select
                            {...field}
                            variant={'outline'}
                            options={accessGroupOptions}
                            onChange={(value) => {
                              form.setFieldValue('accessGroups', value);
                            }}
                            value={field.value || []}
                            placeholder="Select an access group..."
                            isMulti
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            selectedOptionStyle={'check'}
                          />
                          <FormHelperText>
                            Add a Roblox user that isn&apos;t registered on XCS to your organization.
                          </FormHelperText>
                        </FormControl>
                      )}
                    </Field> */}
                  {/* </VStack> */}
                </ModalBody>

                <ModalFooter gap={4}>
                  <Button
                    onClick={() => { setActiveStep(activeStep - 1) }}
                    isDisabled={activeStep === 0}
                  >
                    Previous
                  </Button>
                  <Spacer />
                  {activeStep === 0 ? (
                    <Button
                      onClick={() => { setActiveStep(activeStep + 1) }}
                      isDisabled={activeStep === steps.length - 1}
                      colorScheme='black'
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      isLoading={props.isSubmitting}
                      colorScheme={'black'}
                      isDisabled={
                        (props.values.type === 'user' && (!props.values.id || !props.values.role)) ||
                        (props.values.type === 'roblox' && !props.values.username) ||
                        (props.values.type === 'roblox-group' && (!props.values.name || !props.values.robloxGroupId || !props.values.robloxGroupRoles)) ||
                        (props.values.type === 'card' && (!props.values.name || !props.values.cardNumbers))
                      }
                    >
                      {(props.values.type === 'user') ? "Invite" : "Add"} Member
                    </Button>
                  )}
                  <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
              </ModalContent>
            </Form>
          </Modal>
        )}
      </Formik >
    </>
  );
}
