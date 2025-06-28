/* eslint-disable react/no-children-prop */
// Next
import { useEffect, useState } from 'react';

import { Box, Flex, Stack, useToast } from '@chakra-ui/react';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from '@/lib/firebase';
import { Alert as AlertType } from '@/types';

// Authentication
import { useAuthContext } from '@/contexts/AuthContext';

// Components
import Footer from '@/components/Footer';
import PlatformAlert from '@/components/PlatformAlert';
import PlatformNav from '@/components/nav/PlatformNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, currentUser, isAuthLoaded } = useAuthContext();
  const [firebaseUser, loading, error] = useAuthState(auth);

  const [sendVerificationEmailLoading, setSendVerificationEmailLoading] = useState<boolean>(false);

  const { push } = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  // platform alerts
  const [alerts, setAlerts] = useState<any[]>([]);

  // Wait for the router to be ready before checking if the user is logged in
  useEffect(() => {
    if (loading) return;
    if (!pathname) return;
    if (pathname?.startsWith("/@") || (pathname?.startsWith("/organizations/") && !pathname?.endsWith("settings"))) return;
    setTimeout(() => {
      if (!firebaseUser) {
        push('/auth/login?redirect=' + window.location.pathname);
        toast({
          title: 'You are not logged in',
          description: 'Please log in to continue.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    }, 500);
  }, [loading, firebaseUser, push, toast, pathname]);

  // get platform alerts
  useEffect(() => {
    fetch('/api/v1/platform/alerts').then(async (res) => {
      const data = await res.json();
      setAlerts(data);
    });
  }, [firebaseUser]);

  // Return nothing if the user is not logged in
  return (
    <>
      <PlatformNav />
      <Box
        as={'main'}
        pos={'relative'}
        left={{ base: 0, md: '240px' }}
        w={{ base: '100%', md: 'calc(100% - 240px)' }}
        flexGrow={1}
      >
        <Flex
          pos={'sticky'}
          top={'6rem'}
          flexGrow={1}
          zIndex={1}
        >
          <Stack
            id={'alerts'}
            backdropFilter={'blur(24px)'}
            spacing={0}
            w={'full'}
            h={'full'}
            zIndex={500}
          >
            {/* Platform Alerts */}
            {
              alerts.map((alert: AlertType) => {
                return (
                  <PlatformAlert
                    key={alert.id}
                    status={'info'}
                    title={alert.title || 'Alert'}
                    description={alert.description}
                    isClosable={false}

                  />
                )
              })
            }
            {/* Email not verified */}
            {currentUser && (
              <>
                {/* Email not verified */}
                {!user?.emailVerified && (
                  <PlatformAlert
                    title={'Action needed'}
                    description={'Please verify your email address to continue using Amperra Wyre.'}
                    isClosable={true}
                    button={{
                      text: 'Resend verification email',
                      isLoading: sendVerificationEmailLoading,
                      onClick: async () => {
                        setSendVerificationEmailLoading(true);
                        user.getIdToken().then(async (token: string) => {
                          await fetch('/api/v1/verify/email', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
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
                            .then(async (res) => { })
                            .catch((err) => { })
                            .finally(() => {
                              setSendVerificationEmailLoading(false);
                            });
                        });
                      }
                    }}
                  />
                )}
                {/* Roblox account not verified */}
                {!currentUser?.roblox.verified && (
                  <PlatformAlert
                    title={'Action needed'}
                    description={'Please verify your Roblox account to continue using Amperra Wyre.'}
                    isClosable={true}
                    button={{
                      text: 'Verify Roblox account',
                      onClick: async () => {
                        push(`https://apis.roblox.com/oauth/v1/authorize?client_id=${process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_ROOT_URL}/platform/verify/oauth2/roblox&scope=openid profile&response_type=code`);
                      }
                    }}
                  />
                )
                }
              </>
            )}
          </Stack>
        </Flex>
        <Box minH={'calc(100vh - 6rem)'}>{children}</Box>
        <Footer />
      </Box>
    </>
  );
}
