import Layout from '@/layouts/PublicLayout';
import { Box, Container, FormControl, HStack, Heading, PinInput, PinInputField, Text, chakra } from '@chakra-ui/react';

export default function Demo() {
  return (
    <>
      <Container
        maxW={'container.lg'}
        centerContent
        pt={16}
        minH={'calc(100dvh - 6rem)'}
      >
        <Heading
          as="h1"
          size="xl"
        >
          XCS - Demo
        </Heading>
        <Text variant={'subtext'}>Enter the demo code that was provided to you.</Text>
        <Box py={4}>
          <chakra.div textTransform={'uppercase'}>
            <HStack>
              <PinInput
                size={'lg'}
                colorScheme={'black'}
                type={'alphanumeric'}
              >
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
              </PinInput>
            </HStack>
          </chakra.div>
        </Box>
      </Container>
    </>
  );
}

Demo.getLayout = (page: any) => {
  return <Layout>{page}</Layout>;
};
