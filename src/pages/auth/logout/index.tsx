// React
import { useContext, useEffect } from 'react';

// Chakra UI
import { Center, Spinner, useToast } from '@chakra-ui/react';

// Next
import { useRouter } from 'next/router';

// Authentication
import { useAuthContext } from '@/contexts/AuthContext';

export default function Logout() {
  const router = useRouter();
  const { logOut } = useAuthContext();

  useEffect(() => {
    logOut();
    router.push('/auth/login');
  }, []);

  return (
    <>
      <Center h="100vh">
        <Spinner size={'lg'} />
      </Center>
    </>
  );
}
