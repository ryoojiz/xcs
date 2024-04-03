/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useRef, useState } from 'react';

import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  VStack,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { Field, Form, Formik } from 'formik';

import { useAuthContext } from '@/contexts/AuthContext';
import { Achievement } from '@/types';
import { AsyncSelect, Select } from 'chakra-react-select';
import { useCallback } from 'react';

interface Option {
  label?: string;
  value?: string;
}

export default function AwardAchievementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const formRef = useRef(null);
  const finalRef = useRef(null);
  const { user } = useAuthContext();

  const [achievements, setAchievements] = useState<Achievement[]>([]);


  const getUserSearchResults = useCallback(async (inputValue: string, callback: any) => {
    if (!inputValue) {
      callback([]);
      return;
    }
    await user.getIdToken().then((token: any) => {
      fetch(`/api/v1/admin/search-users/${encodeURIComponent(inputValue)}`, {
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

  const getAchievements = useCallback(async () => {
    user.getIdToken().then((token: any) => {
      fetch(`/api/v1/platform/achievements`, {
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
          setAchievements(data);
        })
        .catch((error) => {
        });
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getAchievements();
  }, [user, getAchievements]);

  return (
    <>
      <Formik
        innerRef={formRef}
        initialValues={{ id: null as Option | null, achievementId: null as Option | null, revoke: false }}
        onSubmit={(values, actions) => {
          user.getIdToken().then((token: string) => {
            fetch(`/api/v1/platform/achievements`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                id: values.id?.value || user.uid,
                achievementId: values.achievementId?.value,
                revoke: values.revoke || false
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
              })
              .catch((error) => {
                toast({
                  title: 'There was an error awarding the achievement.',
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
            onCloseComplete={() => {
              props.resetForm();
            }}
          >
            <ModalOverlay />
            <Form>
              <ModalContent bg={useColorModeValue('white', 'gray.800')}>
                <ModalHeader pb={2}>Award Achievement</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
                    <Field name="id">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Recipient</FormLabel>
                          <AsyncSelect
                            {...field}
                            name="id"
                            options={[]}
                            placeholder="Search for a user... (optional)"
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
                          <FormHelperText>If left blank, you will be the recipient.</FormHelperText>
                        </FormControl>
                      )}
                    </Field>
                    <Field name="achievementId">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Achievement</FormLabel>
                          <Select
                            {...field}
                            name="achievement"
                            options={achievements.map((achievement: Achievement) => {
                              return {
                                label: achievement.name,
                                value: achievement.id
                              } as Option;
                            })}
                            placeholder="Search for an achievement..."
                            isMulti={false}
                            closeMenuOnSelect={true}
                            isClearable={true}
                            size="md"
                            noOptionsMessage={() => 'No search results found.'}
                            onChange={(value) => {
                              form.setFieldValue('achievementId', value);
                            }}
                            value={field.value || []}
                            selectedOptionStyle='check'
                          />
                        </FormControl>
                      )}
                    </Field>
                    <Field name="revoke">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Revoke</FormLabel>
                          <Switch
                            {...field}
                            variant={'outline'}
                            width={'fit-content'}
                            isChecked={form.values?.revoke}
                            onChange={(e: any) => {
                              form.setFieldValue('revoke', e.target.checked);
                            }}
                          />
                          <FormHelperText>Whether or not to revoke the achievement.</FormHelperText>
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
                    Submit
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
