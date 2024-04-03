import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useRef, useState } from 'react';

function DeleteButtonIcon() {
  return <>
    <Image
      src={'/images/7534-dababy.png'}
      alt={'Delete'}
      width={6}
      height={6}
    />
  </>
}

export default function DeleteDialogOrganization({
  isOpen,
  onClose,
  cancelRef,
  onDelete,
  buttonText = 'I Understand, Delete Organization',
  organization
}: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [disabled, setDisabled] = useState(true);


  return (
    <>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
        size={'lg'}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={useColorModeValue('white', 'gray.800')}>
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="bold"
              pb={2}
            >
              Delete Organization
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this organization? This will remove all associated data, including locations, access points, access groups, and API keys.<br /><Text as={'strong'}>This action cannot be undone.</Text>
              <FormControl my={4}>
                <FormLabel>Organization Name</FormLabel>
                <Input
                  placeholder={`Type "${organization?.name}" to confirm`}
                  ref={inputRef}
                  onChange={(e) => {
                    setDisabled(e.target.value !== organization?.name);
                  }}
                />
                <FormHelperText>
                  Type &quot;{organization?.name}&quot; to confirm
                </FormHelperText>
              </FormControl>

            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                colorScheme={'red'}
                onClick={onDelete}
                ml={3}
                isDisabled={disabled}
              >
                {buttonText}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
