/* eslint-disable react-hooks/rules-of-hooks */
import { useRef } from 'react';

import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
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
  VStack,
  useClipboard,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { AsyncSelect } from 'chakra-react-select';
import { Field, Form, Formik } from 'formik';


import { useAuthContext } from '@/contexts/AuthContext';

export default function ReferralCreditsModal({
  isOpen,
  onOpen,
  onClose,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const { currentUser, user } = useAuthContext();
  const senderRef = useRef<any>(null);
  const { setValue: setClipboardValue, onCopy: onClipboardCopy, hasCopied: clipboardHasCopied } = useClipboard('');

  const onModalClose = () => {
    onClose();
  };

  const getUserSearchResults = async (inputValue: string, callback: any) => {
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
          toast({
            title: 'There was an error searching for users.',
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
        enableReinitialize={true}
        initialValues={{
          recipientId: null as
            | {
              label: string;
              value: string;
            }
            | any,
          referrals: 1,
        }}
        onSubmit={async (values, actions) => {
          await user.getIdToken().then(async (token: string) => {
            await fetch(`/api/v1/admin/referral-credits`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                recipientId: values.recipientId?.value,
                referrals: parseInt(values.referrals.toString()) || 1,
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
                actions.resetForm();
                onClose();
              })
              .catch((error) => {
                toast({
                  title: 'There was an error creating the invitation.',
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
            onClose={onModalClose}
            isCentered
            onCloseComplete={() => {
              props.resetForm();
            }}
          >
            <ModalOverlay />
            <Form>
              <ModalContent bg={useColorModeValue('white', 'gray.800')}>
                <ModalHeader pb={2}>Add Referral Credits</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
                    <>
                      <Field name="recipientId">
                        {({ field, form }: any) => (
                          <FormControl>
                            <FormLabel>Recipient</FormLabel>
                            <AsyncSelect
                              {...field}
                              name="Recipient"
                              ref={senderRef}
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
                                form.setFieldValue('recipientId', value);
                              }}
                              value={field.value || []}
                              selectedOptionStyle='check'
                            />
                            <FormHelperText>If left blank, you will be the recipient.</FormHelperText>
                          </FormControl>
                        )}
                      </Field>
                      <Field name="referrals">
                        {({ field, form }: any) => (
                          <FormControl w={'fit-content'} alignSelf={'flex-start'}>
                            <FormLabel>Referral Credits</FormLabel>
                            <InputGroup>
                              <NumberInput
                                {...field}
                                autoComplete="off"
                                placeholder="Referrals"
                                variant={'outline'}
                                min={1}
                                max={100}
                                defaultValue={1}
                                onChange={(value) => {
                                  form.setFieldValue('referrals', value);
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
                              Enter the number of referral credits you want to give to the user here.
                            </FormHelperText>
                          </FormControl>
                        )}
                      </Field>
                    </>
                  </VStack>
                </ModalBody>

                <ModalFooter>
                  <HStack>
                    <Button
                      colorScheme={'black'}
                      isLoading={props.isSubmitting}
                      type={'submit'}
                    >
                      Submit
                    </Button>
                    <Button onClick={onModalClose}>Cancel</Button>
                  </HStack>
                </ModalFooter>
              </ModalContent>
            </Form>
          </Modal>
        )}
      </Formik>
    </>
  );
}
