import { Box, Heading, Stack, Text } from '@chakra-ui/react';

interface Props {
  label: string;
  value: string;
}
export const Stat = (props: Props) => {
  const { label, value, ...boxProps } = props;
  return (
    <Box
      px={{ base: '4', md: '6' }}
      py={{ base: '5', md: '6' }}
      bg={'bg.surface'}
      borderRadius={'lg'}
      borderWidth={'1px'}
      borderColor={'border.secondary'}
      {...boxProps}
    >
      <Stack>
        <Text
          fontSize={'2xl'}
          fontWeight={'900'}
          color="fg.muted"
        >
          {label}
        </Text>
        <Text fontSize={{ base: 'sm', md: 'lg' }}>{value}</Text>
      </Stack>
    </Box>
  );
};
