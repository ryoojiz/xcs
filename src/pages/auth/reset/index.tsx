
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Text,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { MdEmail } from 'react-icons/md';

import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { Field, Form, Formik } from 'formik';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import Section from '@/components/section';
import Layout from '@/layouts/PublicLayout';

export default function Recover() {
  const auth = getAuth();
  const router = useRouter();
  const { push } = router;
  const toast = useToast();

  const redirect = () => {
    push('/auth/login');
  };

  return (
    <>
      <Head>
        <title>Recover Account - Restrafes XCS</title>
        <meta
          name="description"
          content="Recover Account - Restrafes XCS"
        />
        <link
          rel="icon"
          href="/favicon.ico"
        />
        <meta
          name="og:site_name"
          content="Restrafes XCS"
        />
        <meta
          name="og:title"
          content="Recover Account - Restrafes XCS"
        />
        <meta
          name="og:description"
          content="Recover your Restrafes XCS account."
        />
        <meta
          name="og:type"
          content="website"
        />
        <meta
          name="og:url"
          content="https://xcs.restrafes.co"
        />
        <meta
          property="og:image"
          content="/images/logo-square.jpg"
        />
        <meta
          name="og:locale"
          content="en_US"
        />
      </Head>
      <Box
        position={'relative'}
        h={'calc(100vh - 6rem)'}
      >
        <Flex
          position={'relative'}
          align={'center'}
          justify={'center'}
          height={'100%'}
          bottom={{ base: '0', md: '3em' }}
        >
          <Section>
            <Flex
              position={'relative'}
              p={8}
              pb={16}
              flexDir={'column'}
              align={'center'}
              outline={['0px solid', '1px solid']}
              outlineColor={['unset', useColorModeValue('gray.200', 'gray.700')]}
              rounded={'lg'}
              w={['full', 'md']}
            >
              <Box
                w={'full'}
                mx={16}
              >
                <Text
                  fontSize={'3xl'}
                  fontWeight={'bold'}
                >
                  Reset Password
                </Text>
                <Text color={"gray.500"} fontSize={'md'}>Enter your email address to reset your password.</Text>
              </Box>
              <br />
              <Box px={[0, 4]}>
                <Formik
                  initialValues={{
                    email: ''
                  }}
                  onSubmit={(values, actions) => {
                    sendPasswordResetEmail(auth, values.email)
                      .then(() => {
                        toast({
                          title: 'Password reset email sent. Please check your inbox.',
                          status: 'success',
                          duration: 5000,
                          isClosable: true
                        });
                        redirect();
                      })
                      .catch((error) => {
                        const errorCode = error.code;
                        let errorMessage = error.message;
                        switch (errorCode) {
                          case 'auth/invalid-email':
                            errorMessage = "The email address you've entered is invalid. Please try again.";
                            break;
                          case 'auth/user-not-found':
                            errorMessage = "The email address you've entered is invalid. Please try again.";
                            break;
                          default:
                            errorMessage = 'An unknown error occurred.';
                        }
                        toast({
                          title: errorMessage,
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
                    <Form>
                      <Field name="email">
                        {({ field, form }: any) => (
                          <FormControl mb={2}>
                            <FormLabel>Email</FormLabel>
                            <InputGroup>
                              <InputLeftElement pointerEvents="none">
                                <MdEmail color="gray.300" />
                              </InputLeftElement>
                              <Input
                                {...field}
                                type="text"
                                placeholder="Email address"
                                variant={'outline'}
                              />
                            </InputGroup>
                          </FormControl>
                        )}
                      </Field>
                      <Button
                        my={2}
                        w={'full'}
                        isLoading={props.isSubmitting}
                        type={'submit'}
                      >
                        Submit
                      </Button>
                    </Form>
                  )}
                </Formik>
                <Text fontSize={'sm'}>
                  <Link
                    as={NextLink}
                    href="/auth/login"
                    textUnderlineOffset={4}
                  >
                    Return to login
                  </Link>
                </Text>
              </Box>
            </Flex>
          </Section>
        </Flex>
      </Box>
    </>
  );
}

Recover.getLayout = (page: any) => <Layout>{page}</Layout>;