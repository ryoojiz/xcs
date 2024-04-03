import { Box, Stat, StatNumber, Text, useColorModeValue } from '@chakra-ui/react';

export default function StatBox({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Box
      borderRadius={'lg'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      p={4}
      px={4}
      h={'full'}
      flexGrow={1}
    >
      <Stat>
        <Text>{label}</Text>
        <StatNumber>{value}</StatNumber>
        <Text color={'gray.500'}>{helper}</Text>
      </Stat>
    </Box>
  );
}