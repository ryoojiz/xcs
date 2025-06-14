import { useState } from 'react';

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Skeleton,
  Text,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { BsDisplayFill } from 'react-icons/bs';
import { FaKey, FaUser } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';

import { Field, Form, Formik } from 'formik';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import Section from '@/components/section';
import Layout from '@/layouts/PublicLayout';
import http from 'http';

export const getServerSideProps = async ({ query, res }: { query: { activationCode?: string }, res: http.ServerResponse }) => {
  if (!query.activationCode) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false
      }
    };
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/v1/activation/${query.activationCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then((res) => res)

  if (response.status !== 200) { return { redirect: { destination: '/auth/login', permanent: false } } };
  return { props: { valid: true } };
}

export default function Activate({ valid }: { valid: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const { activationCode } = router.query;
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <>
      <Head>
        <title>Activate Account - Restrafes XCS</title>
        <meta
          name="description"
          content="Activate Account - Restrafes XCS"
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
          content="Activate Account - Restrafes XCS"
        />
        <meta
          name="og:description"
          content="Activate your Restrafes XCS account."
        />
        <meta
          name="og:type"
          content="website"
        />
        <meta
          name="og:url"
          content="https://wyre.ryj.my.id"
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
      <Flex
        position={'relative'}
        minH={'calc(100vh - 6rem)'}
        align={'center'}
        justify={'center'}
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
              px={8}
              pt={8}
              pb={16}
              flexDir={'column'}
              align={'center'}
              outline={['0px solid', '1px solid']}
              outlineColor={['unset', useColorModeValue('gray.200', 'gray.700')]}
              rounded={'lg'}
              maxW={{ base: '100%', md: 'lg' }}
            >
              <Box
                w={'full'}
                px={[0, 8]}
                pb={4}
              >
                <Text
                  fontSize={'3xl'}
                  fontWeight={'bold'}
                >
                  Activate Account
                </Text>
              </Box>
              <Box px={[0, 8]}>
                <Formik
                  initialValues={{
                    displayName: '',
                    email: '',
                    username: '',
                    password: ''
                  }}
                  onSubmit={(values, actions) => {
                    fetch(`/api/v1/activation/${activationCode}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        displayName: values.displayName,
                        email: values.email,
                        username: values.username,
                        password: values.password
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
                      .then((res) => {
                        toast({
                          title: 'Account created.',
                          description: 'You can now log in.',
                          status: 'success',
                          duration: 5000,
                          isClosable: true
                        });
                        router.push('/auth/login');
                      })
                      .catch((error) => {
                        toast({
                          title: 'There was an error while creating your account.',
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
                    <Form>
                      <HStack
                        my={2}
                        spacing={2}
                      >
                        <Field name="displayName">
                          {({ field, form }: any) => (
                            <FormControl isRequired={true}>
                              <Skeleton isLoaded={!loading}>
                                <FormLabel>Display Name</FormLabel>
                              </Skeleton>
                              <Skeleton isLoaded={!loading}>
                                <InputGroup>
                                  <InputLeftElement pointerEvents="none">
                                    <BsDisplayFill color="gray.300" />
                                  </InputLeftElement>
                                  <Input
                                    {...field}
                                    type="text"
                                    placeholder="Display Name"
                                    variant={'outline'}
                                  />
                                </InputGroup>
                              </Skeleton>
                            </FormControl>
                          )}
                        </Field>
                        <Field
                          name="username"
                          isRequired={true}
                        >
                          {({ field, form }: any) => (
                            <FormControl isRequired={true}>
                              <Skeleton isLoaded={!loading}>
                                <FormLabel>Username</FormLabel>
                              </Skeleton>
                              <Skeleton isLoaded={!loading}>
                                <InputGroup>
                                  <InputLeftElement pointerEvents="none">
                                    <FaUser color="gray.300" />
                                  </InputLeftElement>
                                  <Input
                                    {...field}
                                    type="username"
                                    placeholder="Username"
                                    variant={'outline'}
                                  />
                                </InputGroup>
                              </Skeleton>
                            </FormControl>
                          )}
                        </Field>
                      </HStack>
                      <Field
                        name="email"
                        isRequired={true}
                      >
                        {({ field, form }: any) => (
                          <FormControl isRequired={true}>
                            <Skeleton isLoaded={!loading}>
                              <FormLabel>Email</FormLabel>
                            </Skeleton>
                            <Skeleton isLoaded={!loading}>
                              <InputGroup my={2}>
                                <InputLeftElement pointerEvents="none">
                                  <MdEmail color="gray.300" />
                                </InputLeftElement>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="Email address"
                                  variant={'outline'}
                                />
                              </InputGroup>
                            </Skeleton>
                          </FormControl>
                        )}
                      </Field>
                      <Field name="password">
                        {({ field, form }: any) => (
                          <FormControl isRequired={true}>
                            <Skeleton isLoaded={!loading}>
                              <FormLabel>Password</FormLabel>
                            </Skeleton>
                            <Skeleton isLoaded={!loading}>
                              <InputGroup my={2}>
                                <InputLeftElement pointerEvents="none">
                                  <RiLockPasswordFill color="gray.300" />
                                </InputLeftElement>
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="Password"
                                  variant={'outline'}
                                />
                              </InputGroup>
                            </Skeleton>
                          </FormControl>
                        )}
                      </Field>
                      <Field name="activationCode">
                        {({ field, form }: any) => (
                          <FormControl isRequired={true}>
                            <Skeleton isLoaded={!loading}>
                              <FormLabel>Activation Code</FormLabel>
                            </Skeleton>
                            <Skeleton isLoaded={!loading}>
                              <InputGroup my={2}>
                                <InputLeftElement pointerEvents="none">
                                  <FaKey color="gray.300" />
                                </InputLeftElement>
                                <Input
                                  {...field}
                                  type="text"
                                  placeholder="Activation Code"
                                  variant={'outline'}
                                  isDisabled={true}
                                  value={activationCode}
                                />
                              </InputGroup>
                            </Skeleton>
                          </FormControl>
                        )}
                      </Field>
                      <Skeleton isLoaded={!loading}>
                        <Button
                          my={2}
                          w={'full'}
                          isLoading={props.isSubmitting}
                          type={'submit'}
                        >
                          Register
                        </Button>
                      </Skeleton>

                      <Text
                        fontSize={'sm'}
                        mb={2}
                      >
                        By creating an account, you agree to our{' '}
                        <Text as={'span'}>
                          <Link
                            as={NextLink}
                            href={'/legal/terms'}
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
                            textDecor={'underline'}
                            textUnderlineOffset={4}
                            whiteSpace={'nowrap'}
                          >
                            Privacy Policy
                          </Link>
                        </Text>
                        .
                      </Text>
                    </Form>
                  )}
                </Formik>
                <Text fontSize={'sm'}>
                  Already have an account?{' '}
                  <Box
                    as={NextLink}
                    href="/auth/login"
                    textDecor={'underline'}
                    textUnderlineOffset={4}
                    transition={'all 0.15s ease'}
                    _hover={{ color: ['gray.300', 'gray.500'] }}
                  >
                    Login
                  </Box>
                  .
                </Text>
              </Box>
            </Flex>
          </Section>
        </Flex>
      </Flex>
    </>
  );
}

Activate.getLayout = (page: any) => <Layout>{page}</Layout>;
