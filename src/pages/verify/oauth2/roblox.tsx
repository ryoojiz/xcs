import { useAuthContext } from '@/contexts/AuthContext';
import { Container, Flex, Spinner, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

export default function RobloxOauth2() {
  const { query, push } = useRouter();
  const { currentUser, refreshCurrentUser, user } = useAuthContext();

  const code = useMemo(() => {
    return query.code;
  }, [query.code]);

  useEffect(() => {
    if (!user || (!query?.code && !query?.error)) return;

    if (code) {
      user
        .getIdToken()
        .then((token: string) => {
          fetch('/api/v1/me/roblox', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code: code
            })
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                refreshCurrentUser();
                push('/settings/3?robloxLinked=true');
              } else {
                push('/settings/3');
              }
            });
        })
        .catch((err: any) => {
          console.log(err);
        });
    }
    if (query.error) {
      push('/settings/3');
    }
  }, [user, code, push, query, refreshCurrentUser]);

  return (
    <Container as={Flex} centerContent h={'100dvh'} align={'center'} justify={'center'}>
      <Spinner />
      <Text pt={4}>
        Verifying...
      </Text>
    </Container>
  );
}
