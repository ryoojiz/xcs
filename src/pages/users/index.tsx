import { useAuthContext } from '@/contexts/AuthContext';
import Layout from '@/layouts/PlatformLayout';

import {
  Avatar,
  AvatarBadge,
  AvatarGroup,
  Box,
  Button,
  ButtonGroup,
  Center,
  Container,
  Flex,
  Heading,
  Text,
  useColorModeValue
} from '@chakra-ui/react';

export default function UserDirectory() {
  return <>
    <Container as={Flex} maxW={'container.lg'} py={8} flexDir='row' justify={'space-evenly'} centerContent>
      <Flex flexDir={'column'}>
        <Heading as="h1" size="xl">
          User Directory
        </Heading>
        <Text fontSize="lg" variant={'subtext'}>
          Coming soon.
        </Text>
      </Flex>
      {/* <Flex flexDir={'column'} border={'1px solid'} borderRadius={'lg'} borderColor={useColorModeValue('gray.200', 'gray.700')} p={4} h={'full'}>
        <Heading as="h1" size="md">
          Coming soon.
        </Heading>
      </Flex> */}
    </Container>
  </>
}

UserDirectory.getLayout = (page: any) => <Layout>{page}</Layout>;
