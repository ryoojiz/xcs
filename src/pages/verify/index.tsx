// Components
import { useEffect, useState } from 'react';

import {
  Box,
  Button,
  Center,
  Code,
  Container,
  Flex,
  Heading,
  Link,
  Skeleton,
  Spacer,
  Stack,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  useColorModeValue,
  useSteps,
  useToast
} from '@chakra-ui/react';

import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { useAuthContext } from '@/contexts/AuthContext';

// Layouts
import Layout from '@/layouts/PlatformLayout';

const steps = [
  { title: 'First', description: 'Join Game' },
  { title: 'Second', description: 'Provide Verification Code' },
  { title: 'Third', description: 'Complete' }
];
export default function Verify() {
  const { push } = useRouter();
  const { user, refreshCurrentUser } = useAuthContext();
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length
  });
  const [robloxCode, setRobloxCode] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const toast = useToast();

  const checkRobloxVerification = () => {
    if (!user) return;
    setLoading(true);
    user.getIdToken().then((token: any) => {
      fetch('/api/v1/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
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
          if (data.user.roblox.verified) {
            setActiveStep(2);
            refreshCurrentUser();
            toast({
              title: 'Your account has been verified.',
              status: 'success',
              duration: 5000,
              isClosable: true
            });
          } else {
            toast({
              title: 'Unable to verify your account with Roblox.',
              description: "Ensure that you've joined the game and provided the correct verification code.",
              status: 'error',
              duration: 5000,
              isClosable: true
            });
          }
        })
        .catch((error) => {
          toast({
            title: 'There was an error checking your verification status.',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  const robloxGenerateCode = () => {
    if (!user) return;
    user.getIdToken().then((token: any) => {
      fetch('/api/v1/verify/roblox', {
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
          setRobloxCode(data.code);
        })
        .catch((error) => {
          toast({
            title: 'There was an error creating the verification code.',
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
      <Head>
        <title>Verification - Restrafes XCS</title>
      </Head>
      <Container
        maxW={'container.lg'}
        p={8}
      >
        <Text
          as={'h1'}
          fontSize={'4xl'}
          fontWeight={'900'}
        >
          Account Verification
        </Text>
        <Stepper
          colorScheme={'black'}
          index={activeStep}
          py={8}
        >
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>

              <Box>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Box>

              <StepSeparator />
            </Step>
          ))}
        </Stepper>
        <Center>
          <Flex
            w={'500px'}
            border={'1px solid'}
            borderColor={useColorModeValue('gray.300', 'gray.700')}
            rounded={'xl'}
            p={8}
            m={2}
            flexDir={'column'}
          >
            {activeStep === 0 && (
              <>
                <Text
                  as={'h2'}
                  fontSize={'3xl'}
                  fontWeight={'900'}
                >
                  Welcome
                </Text>
                <Text>
                  Welcome to the verification process. In just a few steps you will be able to start using the Restrafes
                  XCS platform.
                </Text>
                <Spacer />
                <Stack
                  spacing={2}
                  pt={8}
                >
                  <Button
                    colorScheme={'black'}
                    onClick={() => {
                      robloxGenerateCode();
                      setActiveStep(1);
                    }}
                  >
                    Start Verification
                  </Button>
                </Stack>
              </>
            )}
            {activeStep === 1 && (
              <>
                <Text
                  as={'h2'}
                  fontSize={'3xl'}
                  fontWeight={'900'}
                >
                  Join Verification Game
                </Text>
                <Text fontSize={'xl'}>Your verification code is:</Text>
                <Skeleton isLoaded={robloxCode !== null}>
                  <Text
                    fontSize={'3xl'}
                    fontWeight={'900'}
                  >
                    {robloxCode || 'Loading...'}
                  </Text>
                </Skeleton>
                <Text fontSize={'xl'}>
                  Join the{' '}
                  <Link
                    as={NextLink}
                    href={'https://www.roblox.com/games/14004762328/XCS-Verification'}
                    isExternal={true}
                    textDecor={'underline'}
                    textUnderlineOffset={4}
                  >
                    verification game
                  </Link>{' '}
                  and enter the code above.
                </Text>
                <Spacer />
                <Stack
                  spacing={2}
                  pt={8}
                >
                  <Button
                    colorScheme={'black'}
                    isLoading={isLoading}
                    onClick={() => checkRobloxVerification()}
                  >
                    I&apos;ve entered the code provided
                  </Button>
                </Stack>
              </>
            )}
            {activeStep === 2 && (
              <>
                <Text
                  as={'h2'}
                  fontSize={'3xl'}
                  fontWeight={'900'}
                >
                  Verification Complete
                </Text>
                <Spacer />
                <Stack
                  spacing={2}
                  pt={8}
                >
                  <Button
                    colorScheme={'black'}
                    onClick={() => push('/home')}
                  >
                    Go Home
                  </Button>
                </Stack>
              </>
            )}
          </Flex>
        </Center>
      </Container>
    </>
  );
}

Verify.getLayout = (page: any) => <Layout>{page}</Layout>;
