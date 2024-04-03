/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useRef } from 'react';

import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { AccessGroup, Organization } from '@/types';
import { AsyncSelect, CreatableSelect, Select } from 'chakra-react-select';
import { Field, Form, Formik } from 'formik';

import { agKV, agNames, roleToText, textToRole } from '@/lib/utils';

import { useAuthContext } from '@/contexts/AuthContext';

export default function InviteOrganizationRobloxModal({
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

  const getAccessGroupType = (ag: AccessGroup) => {
    if (ag.type === 'organization') {
      return 'Organization';
    } else if (ag.type === 'location') {
      // TODO: get location name
      return ag.locationName || ag.locationId || 'Unknown';
    } else {
      return ag.type;
    }
  };

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

      return groups;
    },
    [organization]
  );

  return (
    <>
      <Formik
        enableReinitialize={true}
        initialValues={{ username: '', accessGroups: [] }}
        onSubmit={(values, actions) => {
          user.getIdToken().then((token: any) => {
            fetch(`/api/v1/organizations/${organization.id}/members`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                type: 'roblox',
                username: values.username,

                accessGroups: values?.accessGroups?.map((ag: any) => ag?.value)
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
                  title: 'There was an error adding a Roblox user to your organization.',
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
                <ModalHeader pb={2}>Add Roblox Member</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
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
                    Add Roblox User
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
