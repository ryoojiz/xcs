/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from 'react';

import {
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
  useClipboard,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { Select } from 'chakra-react-select';
import { Field, Form, Formik } from 'formik';


import { useAuthContext } from '@/contexts/AuthContext';

export default function InviteOrganizationModal({
  isOpen,
  onOpen,
  onClose,
  onCreate,
  organizationId
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCreate: (location: any) => void;
  organizationId?: string;
}) {
  const toast = useToast();
  const { user } = useAuthContext();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
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

  return (
    <>
      <Formik
        enableReinitialize={true}
        initialValues={{ role: { label: 'Member', value: 1 }, singleUse: true }}
        onSubmit={(values, actions) => {
          user.getIdToken().then((token: any) => {
            fetch(`/api/v1/organizations/${organizationId}/invitations/links`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                singleUse: values.singleUse,
                role: values.role.value
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
                setInviteCode(data.inviteCode);
                setClipboardValue(`${process.env.NEXT_PUBLIC_ROOT_URL}/invitation/${data.inviteCode}`);
                actions.resetForm();
                onCreate(data.inviteCode);
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
                        <Field name="role">
                          {({ field, form }: any) => (
                            <FormControl>
                              <FormLabel>Role</FormLabel>
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
                              />
                            </FormControl>
                          )}
                        </Field>
                        <Field
                          name="singleUse"
                          type={'checkbox'}
                        >
                          {({ field, form }: any) => (
                            <FormControl>
                              <Checkbox
                                {...field}
                                variant={'outline'}
                                isChecked={field.value}
                              >
                                Single Use
                              </Checkbox>
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
                            Share this link with the person you want to invite to your organization.
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
