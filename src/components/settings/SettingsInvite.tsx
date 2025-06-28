import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Portal,
  Skeleton,
  SkeletonCircle,
  Stack,
  Switch,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';

import { AiOutlineUser } from 'react-icons/ai';
import { BiReset } from 'react-icons/bi';
import { IoSave } from 'react-icons/io5';

import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';

import { useAuthContext } from '@/contexts/AuthContext';

import InvitePlatformUserModal from '@/components/InvitePlatformUserModal';
import LocationResetUniverseIdModal from '@/components/settings/LocationResetUniverseIdModal';

export default function SettingsInvite() {
  const { currentUser, isAuthLoaded, refreshCurrentUser } = useAuthContext();

  // Platform Invite Creation Modal
  const {
    isOpen: platformInviteModalOpen,
    onOpen: platformInviteModalOnOpen,
    onClose: platformInviteModalOnClose
  } = useDisclosure();

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  return (
    <>
      <InvitePlatformUserModal
        isOpen={platformInviteModalOpen}
        onOpen={platformInviteModalOnOpen}
        onClose={platformInviteModalOnClose}
        onCreate={() => { }}
      />
      <Box w={'fit-content'}>
        <Heading
          as={'h2'}
          size={'lg'}
        >
          You have {currentUser?.platform?.invites || 0} referral credit{currentUser?.platform?.invites === 1 ? '' : 's'}.
        </Heading>
        <Text fontSize={'md'} color={"gray.500"}>
          Who&apos;s a great addition to wyre? Invite them to join!
        </Text>
        <Button
          mt={4}
          onClick={platformInviteModalOnOpen}
          isDisabled={currentUser?.platform?.invites === 0}
        >
          Invite a User
        </Button>
      </Box>
    </>
  );
}
