/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { AiFillCheckCircle } from 'react-icons/ai';

import { AccessGroup, Organization } from '@/types';
import { AsyncSelect, CreatableSelect, Select } from 'chakra-react-select';
import { Field, Form, Formik } from 'formik';

import { useAuthContext } from '@/contexts/AuthContext';

export default function InviteOrganizationRobloxGroupModal({
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
  const { user } = useAuthContext();

  const [groupRoles, setGroupRoles] = useState<any>([]);
  const [groupSearchResults, setGroupSearchResults] = useState<any>([]);
  const [lastGroupId, setLastGroupId] = useState<any>('');
  const groupIdRef = useRef<any>(null);
  const groupRolesRef = useRef<any>(null);
  const groupNameRef = useRef<any>(null);
  const formRef = useRef<any>(null);

  const getGroupSearchResults = (value: string, callback: any) => {
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
  };

  const fetchGroupRoles = (groupId: any) => {
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
  };

  return (
    <>
      <Formik
        innerRef={formRef}
        enableReinitialize={true}
        initialValues={{
          name: '',
          robloxGroupId: '' as any,
          robloxGroupRoles: [],
          accessGroups: []
        }}
        onSubmit={(values, actions) => {
          user.getIdToken().then((token: any) => {
            fetch(`/api/v1/organizations/${organization.id}/members`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                type: 'roblox-group',
                name: values.name || values.robloxGroupId?.label || 'Roblox Group',
                robloxGroupId: values.robloxGroupId?.value,
                robloxGroupRoles: values.robloxGroupRoles?.map((role: any) => role.value),
                // get access group ids from names
                accessGroups: values?.accessGroups.map((accessGroup: any) => accessGroup.value)
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
                onClose();
                onAdd();
                actions.resetForm();
              })
              .catch((error) => {
                toast({
                  title: 'There was an error adding a Roblox group to your organization.',
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
          >
            <ModalOverlay />
            <Form>
              <ModalContent bg={useColorModeValue('white', 'gray.800')}>
                <ModalHeader pb={2}>Add Roblox Group</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
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
                            Add a Roblox group to your organization to start managing their access.
                          </FormHelperText>
                        </FormControl>
                      )}
                    </Field>
                  </VStack>
                </ModalBody>

                <ModalFooter>
                  <Button
                    colorScheme={'black'}
                    mr={3}
                    isLoading={props.isSubmitting}
                    type={'submit'}
                  >
                    Add Roblox Group
                  </Button>
                  <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
              </ModalContent>
            </Form>
          </Modal>
        )}
      </Formik>
    </>
  );
}
