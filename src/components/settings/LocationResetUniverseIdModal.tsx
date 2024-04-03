/* eslint-disable react-hooks/rules-of-hooks */
import { useRef } from 'react';

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
  VStack,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { Field, Form, Formik } from 'formik';

import { useAuthContext } from '@/contexts/AuthContext';
import { AsyncSelect } from 'chakra-react-select';
import { useCallback } from 'react';

interface Option {
  label?: string;
  value?: string;
}

export default function LocationResetUniverseIdModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const initialRef = useRef(null);
  const finalRef = useRef(null);
  const { user } = useAuthContext();

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

  return (
    <>
      <Formik
        initialValues={{ id: '', memberId: null as Option | null }}
        onSubmit={(values, actions) => {
          user.getIdToken().then((token: string) => {
            fetch(`/api/v1/locations/${values?.id}/resetUniverse`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                memberId: values?.memberId?.value as string
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
                  title: 'There was an error resetting the location\'s universe ID.',
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
                <ModalHeader pb={2}>Reset Location Universe</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
                    <Field name="id">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Location ID</FormLabel>
                          <Input
                            {...field}
                            type='text'
                            variant={'outline'}
                            placeholder={'Location ID'}
                          />
                        </FormControl>
                      )}
                    </Field>
                    <Field name="memberId">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Customer</FormLabel>
                          <AsyncSelect
                            {...field}
                            name="memberId"
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
                              form.setFieldValue('memberId', value);
                            }}
                            value={field.value || []}
                            selectedOptionStyle='check'
                          />
                          <FormHelperText>This is the customer that you&apos;re serving.</FormHelperText>
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
