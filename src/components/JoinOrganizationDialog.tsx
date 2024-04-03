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
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { Field, Form, Formik } from 'formik';

import { useAuthContext } from '@/contexts/AuthContext';

export default function JoinOrganizationDialog({
  isOpen,
  onClose,
  onJoin,
  initialValue = ''
}: {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (organization: any) => void;
  initialValue?: string;
}) {
  const toast = useToast();
  const initialRef = useRef(null);
  const finalRef = useRef(null);
  const { user } = useAuthContext();

  return (
    <>
      <Formik
        initialValues={{ inviteCode: initialValue }}
        onSubmit={async (values, actions) => {
          // Handle Links
          values.inviteCode = values.inviteCode.replace(`${process.env.NEXT_PUBLIC_ROOT_URL}/invitation/`, '');

          await user.getIdToken().then(async (token: string) => {
            await fetch(`/api/v1/organizations/join`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                code: values.inviteCode as string
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
                onJoin(data.organizationId);
              })
              .catch((error) => {
                toast({
                  title: 'There was an error joining the organization.',
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
            initialFocusRef={initialRef}
          >
            <ModalOverlay />
            <Form>
              <ModalContent bg={useColorModeValue('white', 'gray.800')}>
                <ModalHeader>Join Organization</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <Field name="inviteCode">
                    {({ field, form }: any) => (
                      <FormControl>
                        <FormLabel>Invite Code</FormLabel>
                        <Input
                          {...field}
                          variant={'outline'}
                          placeholder={'Invite Code'}
                          ref={initialRef}
                        />
                        <FormHelperText>
                          Received an invite code? Enter it here to join an organization.
                        </FormHelperText>
                      </FormControl>
                    )}
                  </Field>
                </ModalBody>

                <ModalFooter>
                  <Button
                    colorScheme={'black'}
                    mr={3}
                    isLoading={props.isSubmitting}
                    type={'submit'}
                  >
                    Join
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
