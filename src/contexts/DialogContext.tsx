import { Dialog as DialogType } from '@/types';
import {
  AlertDialog,
  AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter,
  AlertDialogHeader, AlertDialogOverlay, Box, Button, useDisclosure, useToast
} from '@chakra-ui/react';
import { createContext, createRef, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface DialogContextValues {
  createToast: ReturnType<typeof useToast>;
  createDialog: () => void;
}

const DialogContext = createContext(null);

function Dialog({ title, description, confirmButtonText, cancelButtonText, callback }: DialogType) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef(null);

  useEffect(() => {
    console.log('Dialog opened');
    onOpen();
  }, []);

  return (
    <>
      <p>hi</p>
      {/* <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {title}
            </AlertDialogHeader>

            <AlertDialogCloseButton />

            <AlertDialogBody>
              {description}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {cancelButtonText}
              </Button>
              <Button colorScheme="red" onClick={callback} ml={3}>
                {confirmButtonText}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog> */}
    </>
  )
}

export function useDialogContext() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const dialogs = [] as any[];
  const createToast = useToast();
  function createDialog({
    title = 'Are you sure?',
    description = 'Are you sure you want to do this?',
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    callback = () => { },
  }: DialogType) {
    dialogs.push({ title, description, confirmButtonText, cancelButtonText, callback });
  }

  return (
    <DialogContext.Provider value={{ createToast, createDialog } as any}>
      <Box>
        {children}
      </Box>
    </DialogContext.Provider>
  )
}