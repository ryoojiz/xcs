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
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { Field, Form, Formik } from 'formik';

import { getRandomAccessPointName } from '@/lib/utils';

import { useAuthContext } from '@/contexts/AuthContext';
import { AccessPoint, Location } from '@/types';
import { Select } from 'chakra-react-select';

export default function CreateAccessPointDialog({
  isOpen,
  onClose,
  location,
  onCreate,
  accessPoints
}: {
  isOpen: boolean;
  onClose: () => void;
  location: Location;
  onCreate: (location: any) => void;
  accessPoints: AccessPoint[];
}) {
  const toast = useToast();
  const initialRef = useRef(null);
  const finalRef = useRef(null);
  const { user } = useAuthContext();

  const namePlaceholder = getRandomAccessPointName();

  return (
    <>
      <Formik
        initialValues={{ name: '', description: '', template: null as null | { label: string, value: any } }}
        onSubmit={(values, actions) => {
          user.getIdToken().then((token: any) => {
            fetch(`/api/v1/locations/${location.id}/access-points`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                name: values.name,
                description: values.description,
                locationId: location.id,
                templateId: values.template?.value || null
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
                onCreate(data.accessPointId);
              })
              .catch((error) => {
                toast({
                  title: 'There was an error creating the access point.',
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
                <ModalHeader pb={2}>New Access Point</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={4}>
                  <VStack spacing={2}>
                    <Field name="name">
                      {({ field, form }: any) => (
                        <FormControl isRequired>
                          <FormLabel>Name</FormLabel>
                          <Input
                            {...field}
                            ref={initialRef}
                            variant={'outline'}
                            placeholder={namePlaceholder || 'Access Point Name'}
                            autoComplete='off'
                          />
                        </FormControl>
                      )}
                    </Field>
                    <Field name="template">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Copy Configuration from Access Point</FormLabel>
                          <Select
                            {...field}
                            options={(accessPoints || []).map((ap: AccessPoint) => ({
                              value: ap.id,
                              label: ap.name
                            })) || []}
                            placeholder={'Access Point (optional)'}
                            onChange={(value) => {
                              form.setFieldValue('template', value);
                            }}
                            value={field.value}
                            single={true}
                            hideSelectedOptions={false}
                            selectedOptionStyle={'check'}
                            isClearable={true}
                          />
                          <FormHelperText>
                            Use an existing access point&apos;s configuration.
                          </FormHelperText>
                        </FormControl>
                      )}
                    </Field>
                    <Field name="description">
                      {({ field, form }: any) => (
                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <Textarea
                            {...field}
                            variant={'outline'}
                            placeholder={'Access Point Description'}
                            maxH={'200px'}
                          />
                          <FormHelperText>
                            This access point will be created under the{' '}
                            <Text
                              as={'span'}
                              fontWeight={'bold'}
                            >
                              {location?.name}
                            </Text>{' '}
                            location.
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
