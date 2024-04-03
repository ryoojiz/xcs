import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  useColorModeValue
} from '@chakra-ui/react';

export default function DeleteDialog({
  isOpen,
  onClose,
  cancelRef,
  onDelete,
  title,
  body,
  buttonText = 'Delete'
}: any) {
  return (
    <>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={useColorModeValue('white', 'gray.800')}>
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="bold"
              pb={2}
            >
              {title ? title : 'Delete item'}
            </AlertDialogHeader>

            <AlertDialogBody>{body ? body : "Are you sure? You can't undo this action afterwards."}</AlertDialogBody>

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
