/* eslint-disable react-hooks/rules-of-hooks */
import { useRef, useState } from 'react';

import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
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
  VStack,
  useClipboard,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { AsyncSelect } from 'chakra-react-select';
import { Field, Form, Formik } from 'formik';


import { useAuthContext } from '@/contexts/AuthContext';

export default function InvitePlatformModal({
  isOpen,
  onOpen,
  onClose,
  onCreate
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCreate: (location: any) => void;
}) {
  const toast = useToast();
  const { currentUser, user } = useAuthContext();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const senderRef = useRef<any>(null);
  const { setValue: setClipboardValue, onCopy: onClipboardCopy, hasCopied: clipboardHasCopied } = useClipboard('');

  const onModalClose = () => {
    onClose();
    setInviteCode(null);
  };

  const copyInviteLink = () => {
    onClipboardCopy();
    toast({
      title: 'Copied invite link to clipboard!',
      status: 'success',
      duration: 5000,
      isClosable: true
    });
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
          code: '',
          senderId: null as
            | {
              label: string;
              value: string;
            }
            | any,
          maxUses: 1,
          referrals: 0,
          comment: ''
        }}
        onSubmit={(values, actions) => {
          user.getIdToken().then((token: any) => {
            fetch(`/api/v1/admin/invite-link`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                maxUses: values.maxUses,
                code: values.code,
                senderId: values.senderId?.value,
                referrals: values.referrals || 0,
                comment: values.comment
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
                setInviteCode(data.code);
                setClipboardValue(`${process.env.NEXT_PUBLIC_ROOT_URL}/invitation/${data.code}`);
                actions.resetForm();
                onCreate(data.code);
                // onClose();
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
              props.setFieldValue('code', '');
              props.setFieldValue('senderId', null);
            }}
          >
            <ModalOverlay />
            <Form>
              <ModalContent bg={useColorModeValue('white', 'gray.800')}>
                <ModalHeader pb={2}>Create Invitation Link</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
                    {!inviteCode ? (
                      <>
                        <InputGroup gap={4}>
                          <Field name="code">
                            {({ field, form }: any) => (
                              <FormControl>
                                <FormLabel>Custom Invite Code</FormLabel>
                                <Input
                                  {...field}
                                  variant={'outline'}
                                  autoComplete="off"
                                  placeholder="Custom Invite Code (optional)"
                                />
                              </FormControl>
                            )}
                          </Field>
                          <Field name="maxUses">
                            {({ field, form }: any) => (
                              <FormControl w={'fit-content'}>
                                <FormLabel>Maximum Uses</FormLabel>
                                <InputGroup>
                                  <NumberInput
                                    {...field}
                                    autoComplete="off"
                                    placeholder="Maximum Uses"
                                    variant={'outline'}
                                    min={1}
                                    max={100}
                                    defaultValue={1}
                                    onChange={(value) => {
                                      form.setFieldValue('maxUses', value);
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
                        </InputGroup>
                        <Field name="senderId">
                          {({ field, form }: any) => (
                            <FormControl>
                              <FormLabel>Sender</FormLabel>
                              <AsyncSelect
                                {...field}
                                name="senderId"
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
                                  form.setFieldValue('senderId', value);
                                }}
                                value={field.value || []}
                                selectedOptionStyle='check'
                              />
                              <FormHelperText>If left blank, you will be the sender.</FormHelperText>
                            </FormControl>
                          )}
                        </Field>
                        <Field name="referrals">
                          {({ field, form }: any) => (
                            <FormControl w={'fit-content'} alignSelf={'flex-start'}>
                              <FormLabel>Starting Referrals</FormLabel>
                              <InputGroup>
                                <NumberInput
                                  {...field}
                                  autoComplete="off"
                                  placeholder="Starting Referrals"
                                  variant={'outline'}
                                  min={0}
                                  max={100}
                                  defaultValue={0}
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
                                If you want to give the user referrals to invite others, enter the number of referrals you want to give them here.
                              </FormHelperText>
                            </FormControl>
                          )}
                        </Field>
                        <Field name="comment">
                          {({ field, form }: any) => (
                            <FormControl isRequired>
                              <FormLabel>Comment</FormLabel>
                              <Input
                                {...field}
                                variant={'outline'}
                                autoComplete="off"
                                placeholder="Comment"
                              />
                              <FormHelperText>
                                All invitation links expire after 14 days.
                              </FormHelperText>
                            </FormControl>
                          )}
                        </Field>
                      </>
                    ) : (
                      <>
                        <FormControl>
                          <FormLabel>Invitation Link</FormLabel>
                          <Input
                            variant={'outline'}
                            value={`${process.env.NEXT_PUBLIC_ROOT_URL}/invitation/${inviteCode}`}
                            isReadOnly={true}
                            onFocus={(e) => e.target.select()}
                          />
                          <FormHelperText>
                            Share this link with the people you want to invite to the platform.
                          </FormHelperText>
                        </FormControl>
                      </>
                    )}
                  </VStack>
                </ModalBody>

                <ModalFooter>
                  {!inviteCode ? (
                    <HStack>
                      <Button
                        colorScheme={'black'}
                        isLoading={props.isSubmitting}
                        type={'submit'}
                      >
                        Create Link
                      </Button>
                      <Button onClick={onModalClose}>Cancel</Button>
                    </HStack>
                  ) : (
                    <HStack>
                      <Button
                        colorScheme={'black'}
                        onClick={copyInviteLink}
                      >
                        {!clipboardHasCopied ? 'Copy Link' : 'Copied!'}
                      </Button>
                      <Button onClick={onModalClose}>Close</Button>
                    </HStack>
                  )}
                </ModalFooter>
              </ModalContent>
            </Form>
          </Modal>
        )}
      </Formik>
    </>
  );
}
