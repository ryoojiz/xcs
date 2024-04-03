/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useRef } from 'react';

import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Link,
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

import { Field, Form, Formik } from 'formik';
import NextLink from 'next/link';

import { useAuthContext } from '@/contexts/AuthContext';
import { getRandomOrganizationName } from '@/lib/utils';

export default function CreateOrganizationDialog({
  isOpen,
  onClose,
  onCreate
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (location: any) => void;
}) {
  const toast = useToast();
  const initialRef = useRef(null);
  const finalRef = useRef(null);
  const { user } = useAuthContext();

  const namePlaceholder = getRandomOrganizationName();

  return (
    <>
      <Formik
        initialValues={{ name: '' }}
        onSubmit={(values, actions) => {
          user.getIdToken().then((token: any) => {
            fetch('/api/v1/organizations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                name: values.name
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
                onCreate(data.organizationId);
              })
              .catch((error) => {
                toast({
                  title: 'There was an error creating the organization.',
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
                <ModalHeader pb={2}>New Organization</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
                    <Field name="name">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Name</FormLabel>
                          <Input
                            {...field}
                            variant={'outline'}
                            placeholder={namePlaceholder || 'Organization Name'}
                            ref={initialRef}
                            autoComplete={'off'}
                          />
                          <FormHelperText>
                            By creating an organization, you agree to our{' '}
                            <Text as={'span'}>
                              <Link
                                as={NextLink}
                                href={'/legal/terms'}
                                target={'_blank'}
                                textDecor={'underline'}
                                textUnderlineOffset={4}
                                whiteSpace={'nowrap'}
                              >
                                Terms of Use
                              </Link>
                            </Text>{' '}
                            and{' '}
                            <Text as={'span'}>
                              <Link
                                as={NextLink}
                                href={'/legal/privacy'}
                                target={'_blank'}
                                textDecor={'underline'}
                                textUnderlineOffset={4}
                                whiteSpace={'nowrap'}
                              >
                                Privacy Policy
                              </Link>
                            </Text>
                            .
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
                    Create
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
