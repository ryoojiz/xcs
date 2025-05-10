/* eslint-disable react-hooks/rules-of-hooks */
import { useRef } from 'react';

import {
  Button,
  FormControl,
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
  VStack,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { useAuthContext } from '@/contexts/AuthContext';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';

export default function CheckActivationCodeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const initialRef = useRef(null);
  const { user } = useAuthContext();
  const { push } = useRouter();

  return (
    <>
      <Formik
        initialValues={{ code: '' }}
        onSubmit={async (values, actions) => {
          const reformatCode = values.code.replace(`${process.env.NEXT_PUBLIC_ROOT_URL}/invitation/`, '');
          await actions.setValues({ 'code': reformatCode });
          await fetch(`/api/v1/activation/${encodeURIComponent(reformatCode || 0)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
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
              onClose();
              push(`/auth/activate/${reformatCode}`)
            })
            .catch((error) => {
              toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true
              });
            })
            .finally(() => {
              actions.setSubmitting(false);
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
                <ModalHeader pb={2}>Activation Code</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
                    <Field name="code">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Activation Code</FormLabel>
                          <Input
                            {...field}
                            ref={initialRef}
                            value={field.value}
                            variant={'outline'}
                            placeholder={'Code'}
                            autoComplete={'off'}
                            autoCorrect={'off'}
                          />
                        </FormControl>
                      )}
                    </Field>
                  </VStack>
                  <Text
                    fontSize={'sm'}
                    color={"gray.500"}
                    pt={2}
                  >
                    Have an activation code? Enter it here to create an account.
                  </Text>
                </ModalBody>

                <ModalFooter>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button
                    colorScheme={'black'}
                    ml={3}
                    isLoading={props.isSubmitting}
                    type={'submit'}
                  >
                    Submit
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Form>
          </Modal>
        )}
      </Formik>
    </>
  );
}
