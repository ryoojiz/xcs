/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useRef, useState } from 'react';

import {
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  Link,
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
  Stack,
  Text,
  Textarea,
  VStack,
  useClipboard,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { AsyncSelect, CreatableSelect, Select } from 'chakra-react-select';
import { Field, Form, Formik } from 'formik';
import NextLink from 'next/link';

import { textToRole } from '@/lib/utils';

import { useAuthContext } from '@/contexts/AuthContext';

export default function InvitePlatformUserModal({
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

  return (
    <>
      <Formik
        enableReinitialize={true}
        initialValues={{}}
        onSubmit={(values, actions) => {
          user.getIdToken().then((token: any) => {
            fetch(`/api/v1/me/referrals`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
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
          >
            <ModalOverlay />
            <Form>
              <ModalContent bg={useColorModeValue('white', 'gray.800')}>
                <ModalHeader pb={2}>Sponsor a User</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
                    {!inviteCode ? (
                      <>
                        <Text>
                          Create an invitation link to invite people to join the platform.
                        </Text>
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
