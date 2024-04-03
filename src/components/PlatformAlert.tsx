import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  CloseButton,
  Flex,
  Stack,
  useDisclosure
} from '@chakra-ui/react';

export default function PlatformAlert({
  status = 'error',
  title,
  description,
  isClosable = true,
  button
}: {
  status?: 'error' | 'info' | 'success' | 'warning';
  title: string;
  description?: string;
  isClosable: boolean;
  button?: {
    isLoading?: boolean;
    text: string;
    onClick: () => void;
  };
}) {
  const { isOpen: isVisible, onClose, onOpen } = useDisclosure({ defaultIsOpen: true });

  return (
    isVisible && (
      <>
        <Alert
          status={status}
          backdropFilter={'blur(24px)'}
        >
          <AlertIcon mx={2} />
          <Stack
            pl={{ base: 0, md: 2 }}
            direction={['column', 'row']}
            align={'center'}
            justify={'space-between'}
            w={'full'}
          >
            <Box>
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription>{description}</AlertDescription>
            </Box>
            <Stack
              direction={'row'}
              h={'full'}
            >
              {button && (
                <Button
                  onClick={button.onClick}
                  variant={'solid'}
                  size={'sm'}
                  isLoading={button.isLoading}
                >
                  {button.text}
                </Button>
              )}
              {isClosable && (
                <CloseButton
                  onClick={onClose}
                  position={'relative'}
                />
              )}
            </Stack>
          </Stack>
        </Alert>
      </>
    )
  );
}
