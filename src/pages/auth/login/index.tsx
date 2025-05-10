/* eslint-disable react-hooks/rules-of-hooks */
// Next

import {
  AbsoluteCenter,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  Collapse // Added Collapse
} from '@chakra-ui/react';
import NextLink from 'next/link';

// Icons
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import { BsDisplayFill } from 'react-icons/bs'; // Added
import { FaUser, FaKey } from 'react-icons/fa'; // Added

// Authentication
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth'; // Corrected import for useAuthState
import { Formik, Form, Field } from 'formik';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePathname } from 'next/navigation';
import { useState } from 'react'; // Added useState

// Components
import CheckActivationCodeModal from '@/components/CheckActivationCodeModal';
import Section from '@/components/section';
import Layout from '@/layouts/PublicLayout';

export default function Login() {
  const router = useRouter();
  const pathname = usePathname();
  const [isRegisterMode, setIsRegisterMode] = useState(false); // Added state for register mode

  const auth = getAuth();
  const [user, loading, error] = useAuthState(auth);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isActivationCodeOpen, onOpen: onActivationCodeOpen, onClose: onActivationCodeClose } = useDisclosure();
  const { isOpen: isResetModalOpen, onOpen: onResetModalOpen, onClose: onResetModalClose } = useDisclosure(); // New state for reset modal
  const toast = useToast();

  function redirectOnAuth() {
      if (router.query.redirect) {
        router.push(router.query.redirect as string);
      } else {
        router.push('/home');
      }
  }

  if (user) {
    redirectOnAuth();
  }

  return (

    <>
      <Head>
        <title>Login - Restrafes XCS</title>
        <meta
          name="description"
          content="Login - Restrafes XCS"
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
          content="Login - Restrafes XCS"
        />
        <meta
          name="og:description"
          content="Authenticate into Restrafes XCS."
        />
        <meta
          name="og:type"
          content="website"
        />
        <meta
          name="og:url"
          content="https://xcs.restrafes.co/login"
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
      <CheckActivationCodeModal isOpen={isActivationCodeOpen} onClose={onActivationCodeClose} />
      <Modal
        onClose={onClose}
        isOpen={isOpen}
        isCentered
        size={'md'}
      >
        <ModalOverlay />
        <ModalContent bg={useColorModeValue('white', 'gray.800')}>
          <ModalHeader>Frequently Asked Questions (FAQ)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <>
              <Text fontWeight={'bold'}>What is Restrafes XCS?</Text>
              <Text>
                Restrafes XCS is an online access point control platform developed by RESTRAFES & CO that allows
                organizations to manage and control access to their facilities remotely.
              </Text>
            </>
            <br />
            <>
              <Text fontWeight={'bold'}>What is my login?</Text>
              <Text>
                Your login for Restrafes XCS is the email address that was used to invite you to the platform. If you
                are unsure of your login or did not receive an invitation, please contact your sponsor or email
                xcs@restrafes.co for assistance.
              </Text>
            </>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        onClose={onResetModalClose}
        isOpen={isResetModalOpen}
        isCentered
        size={'md'}
      >
        <ModalOverlay />
        <ModalContent bg={useColorModeValue('white', 'gray.800')}>
          <ModalHeader>Reset Password</ModalHeader>
          <ModalCloseButton />
          <Formik
            initialValues={{ email: '' }}
            onSubmit={(values, actions) => {
              sendPasswordResetEmail(auth, values.email)
                .then(() => {
                  toast({
                    title: 'Password reset email sent.',
                    description: 'Please check your inbox to reset your password.',
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                  });
                  onResetModalClose();
                })
                .catch((error) => {
                  const errorCode = error.code;
                  let errorMessage = error.message;
                  switch (errorCode) {
                    case 'auth/invalid-email':
                      errorMessage = "The email address you've entered is invalid. Please try again.";
                      break;
                    case 'auth/user-not-found':
                      errorMessage = "No account found with that email address.";
                      break;
                    default:
                      errorMessage = 'An unknown error occurred. Please try again.';
                  }
                  toast({
                    title: 'Error sending reset email',
                    description: errorMessage,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  });
                })
                .finally(() => {
                  actions.setSubmitting(false);
                });
            }}
          >
            {(props) => (
              <Form>
                <ModalBody>
                  <Text mb={4}>Enter your email address below and we'll send you a link to reset your password.</Text>
                  <Field name="email">
                    {({ field, form }: any) => (
                      <FormControl isInvalid={form.errors.email && form.touched.email}>
                        <FormLabel htmlFor="email-reset">Email address</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <MdEmail color="gray.300" />
                          </InputLeftElement>
                          <Input {...field} id="email-reset" placeholder="you@example.com" />
                        </InputGroup>
                      </FormControl>
                    )}
                  </Field>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onResetModalClose}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    isLoading={props.isSubmitting}
                    type="submit"
                  >
                    Send Reset Email
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </ModalContent>
      </Modal>

      <Section>
        <Flex
          position={'relative'}
          height={"calc(100dvh - 6rem)"} // Changed from minH to height
          w="full"
        >
          {/* Background Image */}
          <Image
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            src={'/images/login4.png'}
            alt={'Background'}
            objectFit={'cover'}
            w={'full'}
            h={'full'}
            zIndex={0}
          />

          {/* Login Panel (Left Side) */}
          <Flex
            position="relative"
            zIndex={1}
            w={user ? 'full' : { base: 'full', md: '480px' }} // Conditionally set width
            h="full" // This will now refer to the explicit height of the parent Flex
            bg={useColorModeValue('white', 'gray.800')}
            transition="width 0.6s ease-in-out" // Added transition property
            // backdropFilter="blur(8px)" // Optional: for a frosted glass effect
            direction="column"
            alignItems="center"
            justifyContent="center"
            p={{ base: 6, md: 10 }}
          >
            {
              loading ? (
                <Spinner size="xl" />
              ) : !user ? (
                <Flex
                  direction="column"
                  w="full"
                  maxW="md" // Max width for the form elements
                  align="stretch"
                >
                  <Box w={'full'} textAlign={{ base: "center", md: "left" }}>
                    <Text
                      fontSize={"3xl"}
                      fontWeight={'bold'}
                    >
                      Welcome!
                    </Text>
                    <Text color={useColorModeValue("gray.600", "gray.400")} fontSize={'md'}>Please present your credentials to continue.</Text>
                  </Box>
                  <br />
                  <Box w={"full"}>
                    <Formik
                      initialValues={{
                        email: '',
                        password: '',
                        displayName: '', // Added
                        username: '', // Added
                        activationCode: '', // Added
                        confirmPassword: '' // Added for confirm password
                      }}
                      onSubmit={(values, actions) => {
                        if (isRegisterMode) {
                          // Registration Logic
                          if (values.password !== values.confirmPassword) {
                            toast({
                              title: 'Passwords do not match.',
                              description: 'Please ensure your password and confirmation match.',
                              status: 'error',
                              duration: 5000,
                              isClosable: true
                            });
                            actions.setSubmitting(false);
                            return;
                          }
                          if (!values.activationCode) {
                            toast({
                              title: 'Activation code required.',
                              description: 'Please enter your activation code.',
                              status: 'error',
                              duration: 5000,
                              isClosable: true
                            });
                            actions.setSubmitting(false);
                            return;
                          }
                          fetch(`/api/v1/activation/${values.activationCode}`, {
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
                                  throw new Error(json.message || 'Registration failed');
                                });
                              }
                            })
                            .then(() => {
                              toast({
                                title: 'Account created.',
                                description: 'You can now log in.',
                                status: 'success',
                                duration: 5000,
                                isClosable: true
                              });
                              setIsRegisterMode(false); // Switch back to login mode
                              actions.resetForm();
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
                        } else {
                          // Login Logic
                          signInWithEmailAndPassword(auth, values.email, values.password)
                            .then(() => {
                              redirectOnAuth();
                            })
                            .catch((error) => {
                              const errorCode = error.code;
                              let errorMessage = error.message;
                              switch (errorCode) {
                                case 'auth/invalid-email':
                                  errorMessage = 'The email address you provided is invalid.';
                                  break;
                                case 'auth/invalid-credential':
                                case 'auth/user-not-found':
                                case 'auth/wrong-password':
                                  errorMessage = "Invalid email address or password. Please try again.";
                                  break;
                                case 'auth/user-disabled':
                                  errorMessage = 'Your account has been disabled.';
                                  break;
                                case 'auth/too-many-requests':
                                  errorMessage = 'Too many attempts. Please try again later.';
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
                        }
                      }}
                    >
                      {(props) => (
                        <Form>
                          <Field name="email">
                            {({ field, form }: any) => (
                              <FormControl mt={2} isRequired isInvalid={form.errors.email && form.touched.email}>
                                <FormLabel>Email</FormLabel>
                                <InputGroup>
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
                              </FormControl>
                            )}
                          </Field>
                          <Field name="password">
                            {({ field, form }: any) => (
                              <FormControl mt={2} isRequired isInvalid={form.errors.password && form.touched.password}>
                                <FormLabel>Password</FormLabel>
                                <InputGroup>
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
                              </FormControl>
                            )}
                          </Field>

                          <Collapse in={isRegisterMode} animateOpacity>
                            <Box>
                            <Field name="confirmPassword">
                                {({ field, form }: any) => (
                                  <FormControl mt={2} isRequired={isRegisterMode} isInvalid={form.errors.confirmPassword && form.touched.confirmPassword}>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <InputGroup>
                                      <InputLeftElement pointerEvents="none">
                                        <RiLockPasswordFill color="gray.300" />
                                      </InputLeftElement>
                                      <Input
                                        {...field}
                                        type="password"
                                        placeholder="Confirm Password"
                                        variant={'outline'}
                                      />
                                    </InputGroup>
                                  </FormControl>
                                )}
                              </Field>
                              <Flex direction={{ base: 'column', md: 'row' }}  mt={2} gap={2}>
                                <Field name="displayName">
                                  {({ field, form }: any) => (
                                    <FormControl mt={{ base: 2, md: 0 }} isRequired={isRegisterMode} isInvalid={form.errors.displayName && form.touched.displayName} flex={1}>
                                      <FormLabel>Display Name</FormLabel>
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
                                    </FormControl>
                                  )}
                                </Field>
                                <Field name="username">
                                  {({ field, form }: any) => (
                                    <FormControl mt={{ base: 2, md: 0 }} isRequired={isRegisterMode} isInvalid={form.errors.username && form.touched.username} flex={1}>
                                      <FormLabel>Username</FormLabel>
                                      <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                          <FaUser color="gray.300" />
                                        </InputLeftElement>
                                        <Input
                                          {...field}
                                          type="text"
                                          placeholder="Username"
                                          variant={'outline'}
                                        />
                                      </InputGroup>
                                    </FormControl>
                                  )}
                                </Field>
                              </Flex>

                              <Field name="activationCode">
                                {({ field, form }: any) => (
                                  <FormControl mt={2} isRequired={isRegisterMode} isInvalid={form.errors.activationCode && form.touched.activationCode}>
                                    <FormLabel>Activation Code</FormLabel>
                                    <InputGroup>
                                      <InputLeftElement pointerEvents="none">
                                        <FaKey color="gray.300" />
                                      </InputLeftElement>
                                      <Input
                                        {...field}
                                        type="text"
                                        placeholder="Activation Code"
                                        variant={'outline'}
                                      />
                                    </InputGroup>
                                  </FormControl>
                                )}
                              </Field>
                            </Box>
                          </Collapse>

                          <Button
                            my={4}
                            w={'full'}
                            isLoading={props.isSubmitting}
                            type={'submit'}
                          >
                            {isRegisterMode ? 'Create Account' : 'Log in'}
                          </Button>
                        </Form>
                      )}
                    </Formik>
                    
                    {isRegisterMode ? (
                      <Text fontSize={'sm'} mt={2} textAlign={{ base: "center", md: "left" }}>
                        Already have an account?{' '}
                        <Link onClick={() => setIsRegisterMode(false)} cursor="pointer" textDecor={'underline'} textUnderlineOffset={4}>
                          Login
                        </Link>
                      </Text>
                    ) : (
                      <Button
                        w={'full'}
                        variant={'outline'}
                        onClick={() => setIsRegisterMode(true)}
                      >
                        Create an Account
                      </Button>
                    )}
                    {isRegisterMode && (
                      <Text fontSize={'sm'}>
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
                    )}
                    <Text fontSize={'sm'} mt={4} textAlign={{ base: "center", md: "left" }}>
                      <Link
                        onClick={onResetModalOpen}                        
                        textUnderlineOffset={4}
                        cursor="pointer"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        Forgot your password?
                      </Link>
                    </Text>
                    <Text fontSize={'sm'} mt={2} textAlign={{ base: "center", md: "left" }}>
                      Need help?{' '}
                      <Box
                        as="button"
                        onClick={onOpen}
                        textDecor={'underline'}
                        textUnderlineOffset={4}
                        transition={'all 0.15s ease'}
                        _hover={{ color: useColorModeValue('gray.600', 'gray.400') }}
                      >
                        View the FAQ.
                      </Box>
                    </Text>


                  </Box>
                </Flex>
              ) : (
                // User is logged in, redirectOnAuth has been called. Show spinner during transition.
                <Spinner size="xl" />
              )
            }
          </Flex>
        </Flex>
      </Section>
    </>
  );
}

Login.getLayout = (page: any) => <Layout>{page}</Layout>;