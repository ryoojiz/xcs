/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useState } from 'react';

import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Skeleton,
  Spacer,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  chakra,
  useClipboard,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react';

import { ChevronRightIcon } from '@chakra-ui/icons';

import { IoIosRemoveCircle } from 'react-icons/io';
import { IoClipboard, IoSave } from 'react-icons/io5';

import { AccessGroup, Organization, OrganizationMember } from '@/types';
import Editor from '@monaco-editor/react';
import { CreatableSelect, Select } from 'chakra-react-select';
import { Field, Form, Formik } from 'formik';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { useAuthContext } from '@/contexts/AuthContext';

import Layout from '@/layouts/PlatformLayout';

import DeleteDialog from '@/components/DeleteDialog';

const ChakraEditor = chakra(Editor);
export default function PlatformAccessPoint() {
  const { query, push } = useRouter();
  const { user } = useAuthContext();
  const [accessPoint, setAccessPoint] = useState<any>(null);
  const themeBorderColor = useColorModeValue('gray.200', 'gray.700');
  const [accessGroupOptions, setAccessGroupOptions] = useState<any>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [memberChoices, setMemberChoices] = useState<any[]>([]);
  const [tagsOptions, setTagsOptions] = useState<any>([]); // [{ value: 'tag', label: 'tag' }
  const toast = useToast();
  const {
    hasCopied: clipboardHasCopied,
    setValue: clipboardSetValue,
    value: clipboardValue,
    onCopy: clipboardOnCopy
  } = useClipboard('');

  const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();

  const onDelete = useCallback(async () => {
    await user.getIdToken().then(async (idToken: any) => {
      await fetch(`/api/v1/access-points/${query.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` }
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
          push(`/locations/${accessPoint?.location?.id}/access-points`);
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
  }, [accessPoint?.location?.id, onDeleteDialogClose, push, query.id, toast, user]);

  useEffect(() => {
    if (!accessPoint) return;
    user.getIdToken().then(async (idToken: any) => {
      await fetch(`/api/v1/organizations/${accessPoint.organizationId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          setOrganization(data.organization);

          let options = [
            {
              label: 'Users',
              options: [],
              type: 'user'
            },
            {
              label: 'Roblox Users',
              options: [],
              type: 'roblox'
            },
            {
              label: 'Roblox Groups',
              options: [],
              type: 'roblox-group'
            },
            {
              label: 'Card Numbers',
              options: [],
              type: 'card'
            }
          ];
          let optionsMap = {
            user: options[0],
            roblox: options[1],
            'roblox-group': options[2],
            card: options[3]
          } as any;

          Object.values(data.organization.members || {}).map((member: any) => {
            let label;
            switch (member.type) {
              case 'user':
                label = `${member.displayName} (@${member.username})`;
                break;
              case 'roblox':
                label = `${member.displayName} (@${member.username})`;
                break;
              case 'roblox-group':
                label = member.groupName || member.displayName || member.name;
                break;
              case 'card':
                label = member.name;
                break;
              default:
                label = member.id;
                break;
            };
            optionsMap[(member.type as string) || 'user'].options.push({
              label,
              value: member.formattedId !== null ? member.formattedId : member.id
            });
          });

          setMemberChoices(options);
        });
    });
  }, [accessPoint, user]);

  let refreshData = useCallback(async () => {
    setAccessPoint(null);
    await user.getIdToken().then(async (idToken: any) => {
      await fetch(`/api/v1/access-points/${query.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` }
      })
        .then((res) => {
          if (res.status === 200) return res.json();
          push('/organizations');
          switch (res.status) {
            case 404:
              throw new Error('Access point not found.');
            case 403:
              throw new Error('You do not have permission to view this access point.');
            case 401:
              throw new Error('You do not have permission to view this access point.');
            case 500:
              throw new Error('An internal server error occurred.');
            default:
              throw new Error('An unknown error occurred.');
          }
        })
        .then((data) => {
          setAccessPoint(data.accessPoint);
          if (clipboardValue === '') {
            clipboardSetValue(data.accessPoint?.id);
          }
        })
        .catch((err) => {
          toast({
            title: 'There was an error fetching the access point.',
            description: err.message,
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        });
    });
  }, [clipboardSetValue, clipboardValue, push, query.id, toast, user]);

  // Fetch location data
  useEffect(() => {
    if (!user) return;
    if (!query.id) return;
    refreshData();
  }, [query.id, user, refreshData]);

  const getAccessGroupType = useCallback((ag: AccessGroup) => {
    if (ag.type === 'organization') {
      return 'Organization';
    } else if (ag.type === 'location') {
      return ag.locationName || ag.locationId || 'Unknown';
    } else {
      return ag.type;
    }
  }, []);

  const getAccessGroupOptions = useCallback(
    (organization: Organization) => {
      if (!organization) return [];
      const ags = Object.values(organization?.accessGroups) || [];
      interface Group {
        label: string;
        options: {
          label: string;
          value: string;
        }[];
      }
      let groups = [] as any;

      ags.forEach((ag: AccessGroup) => {
        if (ag.type === 'location' && ag.locationId !== accessPoint?.locationId) return;
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
    [accessPoint?.locationId, getAccessGroupType]
  );

  useEffect(() => {
    if (!accessPoint) return;
    if (!accessPoint?.organization) return;
    getAccessGroupOptions(accessPoint?.organization);
  }, [accessPoint, getAccessGroupOptions]);

  useEffect(() => {
    if (!accessPoint) return;
    if (!user) return;

    user.getIdToken().then(async (idToken: any) => {
      await fetch(`/api/v1/locations/${accessPoint.locationId}/access-points`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` }
      })
        .then((res) => {
          if (res.status === 200) return res.json();
          throw new Error(`Failed to fetch access points. (${res.status})`);
        })
        .then((data) => {
          let accessPoints = data.accessPoints;
          let res = [] as string[];
          accessPoints?.forEach((accessPoint: any) => {
            res = [...res, ...(accessPoint?.tags || [])];
          });
          res = [...(new Set(res as any) as any)];
          setTagsOptions([
            ...(new Set(
              res.map((value: string) => {
                return {
                  value,
                  label: value as string
                };
              })
            ) as any)
          ]);
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
  }, [accessPoint, toast, user]);

  return (
    <>
      <Head>
        <title>{accessPoint?.name} - Amperra Wyre</title>
        <meta
          property="og:title"
          content="Manage Access Point - Amperra Wyre"
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
      <DeleteDialog
        title="Delete Access Point"
        body="Are you sure you want to delete this access point? This action cannot be undone."
        isOpen={isDeleteDialogOpen}
        onClose={onDeleteDialogClose}
        onDelete={onDelete}
      />
      <Box
        maxW={'container.md'}
        p={8}
      >
        <Skeleton isLoaded={accessPoint && organization}>
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
                href={`/organizations/${accessPoint?.organizationId}/settings`}
                textUnderlineOffset={4}
              >
                {accessPoint?.organization?.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink
                as={NextLink}
                href={`/locations/${accessPoint?.location?.id}/access-points`}
                textUnderlineOffset={4}
              >
                {accessPoint?.location?.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink
                href="#"
                textUnderlineOffset={4}
              >
                {accessPoint?.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Skeleton>
        <Skeleton isLoaded={accessPoint && organization}>
          <Text
            as={'h1'}
            fontSize={'4xl'}
            fontWeight={'900'}
            lineHeight={0.9}
            mb={2}
          >
            {accessPoint?.name || 'Loading...'}
          </Text>
        </Skeleton>
        <Skeleton isLoaded={accessPoint && organization}>
          <Text
            fontSize={'lg'}
            color={'gray.500'}
          >
            {accessPoint?.organization.name} – {accessPoint?.location.name}
          </Text>
        </Skeleton>
        <Divider my={4} />
        <Box minW={['100%', 'fit-content']}>
          <Formik
            enableReinitialize={true}
            initialValues={{
              name: accessPoint?.name,
              tags:
                accessPoint?.tags?.map((tag: string) => ({
                  label: tag,
                  value: tag
                })) || [],
              description: accessPoint?.description,
              active: accessPoint?.config?.active,
              armed: accessPoint?.config?.armed,
              unlockTime: accessPoint?.config?.unlockTime,
              accessGroups: accessPoint?.config?.alwaysAllowed?.groups.map((ag: AccessGroup) => ({
                label: Object.values(accessPoint?.organization?.accessGroups as AccessGroup[]).find(
                  (oag: any) => oag.id === ag
                )?.name,
                value: ag
              })) as {
                label: string;
                value: any;
              }[],
              members: (accessPoint?.config?.alwaysAllowed?.members || []).map((memberId: any) => {
                let label;
                let member = Object.values(organization?.members || {}).find(
                  (m: any) => m.formattedId === memberId
                ) as OrganizationMember;
                switch (member?.type) {
                  case 'user':
                    label = `${member.displayName} (@${member.username})`;
                    break;
                  case 'roblox':
                    label = `${member.displayName} (@${member.username})`;
                    break;
                  case 'roblox-group':
                    label = member.groupName || member.displayName || member.name;
                    break;
                  case 'card':
                    label = member.name;
                    break;
                  default:
                    label = memberId;
                    break;
                };
                return {
                  label,
                  value: memberId
                };
              }) as {
                label: string;
                value: any;
              }[],
              alwaysAllowedUsers: JSON.stringify(accessPoint?.config?.alwaysAllowed?.users),
              scanDataDisarmed: JSON.stringify(accessPoint?.config?.scanData?.disarmed || {}, null, 3),
              scanDataReady: JSON.stringify(accessPoint?.config?.scanData?.ready || {}, null, 3),
              webhookUrl: accessPoint?.config?.webhook?.url,
              webhookEventGranted: accessPoint?.config?.webhook?.eventGranted,
              webhookEventDenied: accessPoint?.config?.webhook?.eventDenied
            }}
            onSubmit={(values, actions) => {
              user.getIdToken().then((token: any) => {
                fetch(`/api/v1/access-points/${query.id}`, {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    name: values.name,
                    description: values.description || '',
                    tags: values.tags.map((tag: any) => tag.value),

                    config: {
                      active: values.active,
                      armed: values.armed,
                      unlockTime: values.unlockTime,

                      alwaysAllowed: {
                        // users: JSON.parse(values.alwaysAllowedUsers),
                        members: values.members.map((m: any) => m.value),
                        groups: values?.accessGroups?.map((ag: any) => ag?.value)
                      },

                      webhook: {
                        url: values.webhookUrl,
                        eventGranted: values.webhookEventGranted,
                        eventDenied: values.webhookEventDenied
                      },

                      scanData: {
                        disarmed: values.scanDataDisarmed,
                        ready: values.scanDataReady
                      }
                    }
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
                      title: 'There was an error updating the access point.',
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
                <Heading
                  as={'h2'}
                  fontSize={'xl'}
                  fontWeight={'900'}
                  py={2}
                >
                  General
                </Heading>
                <Flex
                  direction={'column'}
                  gap={2}
                >
                  <Field
                    name="name"
                    w={'min-content'}
                  >
                    {({ field, form }: any) => (
                      <FormControl w={'fit-content'}>
                        <Skeleton isLoaded={accessPoint && organization}>
                          <FormLabel>Name</FormLabel>
                          <Input
                            {...field}
                            type="text"
                            autoComplete="off"
                            placeholder="Access Point Name"
                          />
                        </Skeleton>
                      </FormControl>
                    )}
                  </Field>
                  <Field name="description">
                    {({ field, form }: any) => (
                      <FormControl w={{ base: 'full', md: '320px' }}>
                        <Skeleton isLoaded={accessPoint && organization}>
                          <FormLabel>Description</FormLabel>
                          <Textarea
                            {...field}
                            type="text"
                            autoComplete="off"
                            placeholder="Access Point Description"
                            maxH={'240px'}
                          />
                        </Skeleton>
                      </FormControl>
                    )}
                  </Field>
                  <Field name="tags">
                    {({ field, form }: any) => (
                      <FormControl w={{ base: 'full', md: '320px' }}>
                        <Skeleton isLoaded={accessPoint && organization}>
                          <FormLabel>Tags</FormLabel>
                          <CreatableSelect
                            options={tagsOptions}
                            placeholder="Select a tag..."
                            onChange={(value) => {
                              form.setFieldValue(
                                'tags',
                                value.map((v: any) => {
                                  return {
                                    label: v.value,
                                    value: v.value
                                  };
                                })
                              );
                            }}
                            value={field?.value}
                            isMulti
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            selectedOptionStyle={'check'}
                          />
                          <FormHelperText>
                            Tags are used to organize access points, and can be used to filter access points in the
                            access point list.
                          </FormHelperText>
                        </Skeleton>
                      </FormControl>
                    )}
                  </Field>
                </Flex>
                <Heading
                  as={'h2'}
                  fontSize={'xl'}
                  fontWeight={'900'}
                  pt={4}
                >
                  Configuration
                </Heading>
                <Tabs
                  isManual
                  py={2}
                >
                  <TabList mb={2}>
                    <Tab>Main Settings</Tab>
                    <Tab>Permissions</Tab>
                    <Tab>Scan Data</Tab>
                    <Tab>Webhook Integration</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <Flex
                        direction={'column'}
                        gap={2}
                      >
                        <Stack
                          direction={'row'}
                          spacing={2}
                          w={'fit-content'}
                        >
                          <Field name="active">
                            {({ field, form }: any) => (
                              <FormControl>
                                <Skeleton isLoaded={accessPoint && organization}>
                                  <FormLabel>Active</FormLabel>
                                  <InputGroup>
                                    <Switch
                                      {...field}
                                      colorScheme="black"
                                      placeholder="Active"
                                      variant={'outline'}
                                      width={'fit-content'}
                                      defaultChecked={accessPoint?.config?.active}
                                    />
                                  </InputGroup>
                                </Skeleton>
                              </FormControl>
                            )}
                          </Field>
                          <Field name="armed">
                            {({ field, form }: any) => (
                              <FormControl>
                                <Skeleton isLoaded={accessPoint && organization}>
                                  <FormLabel>Armed</FormLabel>
                                  <InputGroup>
                                    <Switch
                                      {...field}
                                      colorScheme="red"
                                      placeholder="Armed"
                                      variant={'outline'}
                                      width={'fit-content'}
                                      defaultChecked={accessPoint?.config?.armed}
                                    />
                                  </InputGroup>
                                </Skeleton>
                              </FormControl>
                            )}
                          </Field>
                        </Stack>
                        <Field name="unlockTime">
                          {({ field, form }: any) => (
                            <FormControl w={'fit-content'}>
                              <Skeleton isLoaded={accessPoint && organization}>
                                <FormLabel>Unlock Time</FormLabel>
                                <InputGroup mb={2}>
                                  <NumberInput
                                    {...field}
                                    autoComplete="off"
                                    placeholder="Unlock Time"
                                    variant={'outline'}
                                    min={1}
                                    defaultValue={8}
                                    onChange={(value) => {
                                      form.setFieldValue('unlockTime', value);
                                    }}
                                  >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                </InputGroup>
                                <FormHelperText>
                                  The number of seconds to keep the access point unlocked for.
                                </FormHelperText>
                              </Skeleton>
                            </FormControl>
                          )}
                        </Field>
                      </Flex>
                    </TabPanel>
                    <TabPanel>
                      <Stack
                        direction={{ base: 'column', md: 'column' }}
                        spacing={2}
                      >
                        <Field name="members">
                          {({ field, form }: any) => (
                            <FormControl
                              w={{ base: 'full', md: '320px' }}
                              maxW={'75%'}
                            >
                              <Skeleton isLoaded={accessPoint && organization}>
                                <FormLabel>Members</FormLabel>
                                <Select
                                  {...field}
                                  name="members"
                                  placeholder="Select a member..."
                                  options={memberChoices}
                                  onChange={(value) => {
                                    form.setFieldValue('members', value);
                                  }}
                                  value={field?.value}
                                  isMulti
                                  closeMenuOnSelect={false}
                                  hideSelectedOptions={false}
                                  selectedOptionStyle={'check'}
                                />
                                <FormHelperText>
                                  Choose which members will be allowed to access this access point.
                                </FormHelperText>
                              </Skeleton>
                            </FormControl>
                          )}
                        </Field>
                        <Field name="accessGroups">
                          {({ field, form }: any) => (
                            <FormControl
                              w={{ base: 'full', md: '320px' }}
                              maxW={'75%'}
                            >
                              <Skeleton isLoaded={accessPoint && organization}>
                                <FormLabel>Access Groups</FormLabel>
                                <Select
                                  {...field}
                                  name="accessGroups"
                                  options={accessGroupOptions}
                                  placeholder="Select an access group..."
                                  onChange={(value) => {
                                    form.setFieldValue('accessGroups', value);
                                  }}
                                  value={field?.value}
                                  isMulti
                                  closeMenuOnSelect={false}
                                  hideSelectedOptions={false}
                                  selectedOptionStyle={'check'}
                                />
                                <FormHelperText>
                                  Choose which access groups will be allowed to access this access point.
                                </FormHelperText>
                              </Skeleton>
                            </FormControl>
                          )}
                        </Field>
                      </Stack>
                    </TabPanel>
                    <TabPanel>
                      <Stack
                        direction={{ base: 'column', md: 'row' }}
                        spacing={2}
                      >
                        <Field name="scanDataDisarmed">
                          {({ field, form }: any) => (
                            <FormControl>
                              <Skeleton isLoaded={accessPoint && organization}>
                                <FormLabel>Disarmed</FormLabel>
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
                                    value={field?.value}
                                    onChange={(value) => {
                                      form.setFieldValue('scanDataDisarmed', value);
                                    }}
                                  />
                                </Box>
                                <FormHelperText>
                                  This data will be passed when the access point is on &quot;disarmed&quot; status.
                                </FormHelperText>
                              </Skeleton>
                            </FormControl>
                          )}
                        </Field>
                        <Field name="scanDataReady">
                          {({ field, form }: any) => (
                            <FormControl>
                              <Skeleton isLoaded={accessPoint && organization}>
                                <FormLabel>Ready</FormLabel>
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
                                    value={field?.value}
                                    onChange={(value) => {
                                      form.setFieldValue('scanDataReady', value);
                                    }}
                                  />
                                </Box>
                                <FormHelperText>
                                  This data will be passed when the access point is on &quot;ready&quot; status.
                                </FormHelperText>
                              </Skeleton>
                            </FormControl>
                          )}
                        </Field>
                      </Stack>
                    </TabPanel>
                    <TabPanel>
                      <Field
                        name="webhookUrl"
                        w={'min-content'}
                      >
                        {({ field, form }: any) => (
                          <FormControl w={'full'}>
                            <Skeleton isLoaded={accessPoint && organization}>
                              <FormLabel>Webhook URL</FormLabel>
                              <InputGroup mb={2}>
                                <Input
                                  {...field}
                                  type="text"
                                  autoComplete="off"
                                  placeholder="Webhook URL"
                                  variant={'outline'}
                                />
                              </InputGroup>
                            </Skeleton>
                          </FormControl>
                        )}
                      </Field>
                      <Heading
                        as={'h3'}
                        fontSize={'xl'}
                        fontWeight={'900'}
                        mt={4}
                      >
                        Trigger Events
                      </Heading>
                      <Stack
                        direction={'row'}
                        spacing={2}
                        py={2}
                        w={'fit-content'}
                      >
                        <Field name="webhookEventGranted">
                          {({ field, form }: any) => (
                            <FormControl>
                              <Skeleton isLoaded={accessPoint && organization}>
                                <FormLabel>Granted</FormLabel>
                                <InputGroup>
                                  <Switch
                                    {...field}
                                    variant={'outline'}
                                    width={'fit-content'}
                                    defaultChecked={accessPoint?.config?.webhook?.eventGranted}
                                  />
                                </InputGroup>
                              </Skeleton>
                            </FormControl>
                          )}
                        </Field>
                        <Field name="webhookEventDenied">
                          {({ field, form }: any) => (
                            <FormControl>
                              <Skeleton isLoaded={accessPoint && organization}>
                                <FormLabel>Denied</FormLabel>
                                <InputGroup>
                                  <Switch
                                    {...field}
                                    variant={'outline'}
                                    width={'fit-content'}
                                    defaultChecked={accessPoint?.config?.webhook?.eventDenied}
                                  />
                                </InputGroup>
                              </Skeleton>
                            </FormControl>
                          )}
                        </Field>
                      </Stack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                <Stack
                  direction={{ base: 'column', md: 'row' }}
                  spacing={2}
                  py={2}
                >
                  <Button
                    mb={2}
                    leftIcon={<IoSave />}
                    isLoading={props.isSubmitting}
                    type={'submit'}
                  >
                    Save Changes
                  </Button>
                  {/* <Button mb={2} leftIcon={<IoTime />} isDisabled>
                    Setup Timed Access
                  </Button> */}
                  <Button
                    mb={2}
                    leftIcon={<IoClipboard />}
                    onClick={async () => {
                      clipboardOnCopy();
                      toast({
                        title: 'Copied access point ID to clipboard.',
                        status: 'success',
                        duration: 5000,
                        isClosable: true
                      });
                    }}
                  >
                    {clipboardHasCopied ? 'Copied!' : 'Copy ID'}
                  </Button>
                  <Spacer />
                  <Button
                    colorScheme="red"
                    mb={2}
                    onClick={onDeleteDialogOpen}
                    leftIcon={<IoIosRemoveCircle />}
                  >
                    Delete
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>
        </Box>
      </Box >
    </>
  );
}

PlatformAccessPoint.getLayout = (page: any) => <Layout>{page}</Layout>;
