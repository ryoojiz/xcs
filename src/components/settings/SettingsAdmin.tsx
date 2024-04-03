import { useEffect } from 'react';

import {
  Box,
  Button,
  FormControl,
  Heading,
  Stack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';

import { AiFillTrophy, AiOutlineUser } from 'react-icons/ai';
import { BiReset } from 'react-icons/bi';

import { useRouter } from 'next/router';

import { useAuthContext } from '@/contexts/AuthContext';

import InvitePlatformModal from '@/components/InvitePlatformModal';
import LocationResetUniverseIdModal from '@/components/settings/LocationResetUniverseIdModal';
import AwardAchievementModal from './AwardAchievementModal';
import ReferralCreditsModal from './ReferralCreditsModal';

export default function SettingsProfile() {
  const { currentUser, refreshCurrentUser, user, isAuthLoaded } = useAuthContext();
  const toast = useToast();
  const { push } = useRouter();

  useEffect(() => {
    if (!currentUser) return;
    if (!currentUser?.platform?.staff) {
      toast({
        title: 'You are not authorized to view this page.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      push('/settings/profile');
      return;
    }
  }, [currentUser, push, toast]);

  // Platform Invite Creation Modal
  const {
    isOpen: platformInviteModalOpen,
    onOpen: platformInviteModalOnOpen,
    onClose: platformInviteModalOnClose
  } = useDisclosure();

  // Location Universe ID Reset Modal
  const {
    isOpen: locationUniverseIdResetModalOpen,
    onOpen: locationUniverseIdResetModalOnOpen,
    onClose: locationUniverseIdResetModalOnClose
  } = useDisclosure();

  const {
    isOpen: referralCreditModalOpen,
    onOpen: referralCreditModalOnOpen,
    onClose: referralCreditModalOnClose
  } = useDisclosure();

  const {
    isOpen: achievementModalOpen,
    onOpen: achievementModalOnOpen,
    onClose: achievementModalOnClose
  } = useDisclosure();

  return (
    <>
      <InvitePlatformModal
        isOpen={platformInviteModalOpen}
        onOpen={platformInviteModalOnOpen}
        onClose={platformInviteModalOnClose}
        onCreate={() => { }}
      />
      <LocationResetUniverseIdModal
        isOpen={locationUniverseIdResetModalOpen}
        onClose={locationUniverseIdResetModalOnClose}
      />
      <ReferralCreditsModal
        isOpen={referralCreditModalOpen}
        onOpen={referralCreditModalOnOpen}
        onClose={referralCreditModalOnClose}
      />
      <AwardAchievementModal
        isOpen={achievementModalOpen}
        onClose={achievementModalOnClose}
      />
      {isAuthLoaded && currentUser && (
        <Box w={'fit-content'}>
          <Heading
            as={'h2'}
            size={'lg'}
          >
            Platform
          </Heading>
          <Stack py={4}>
            <FormControl>
              <Button
                mb={2}
                leftIcon={<AiOutlineUser />}
                onClick={platformInviteModalOnOpen}
              >
                Create Registration Invite
              </Button>
            </FormControl>
            <FormControl>
              <Button
                mb={2}
                leftIcon={<BiReset />}
                onClick={referralCreditModalOnOpen}
              >
                Add Referral Credits
              </Button>
            </FormControl>
          </Stack>
          <Heading
            as={'h2'}
            size={'lg'}
          >
            Customer Support
          </Heading>
          <Stack py={4}>
            <FormControl>
              <Button
                mb={2}
                leftIcon={<BiReset />}
                onClick={locationUniverseIdResetModalOnOpen}
              >
                Reset Location Universe
              </Button>
            </FormControl>
            <FormControl>
              <Button
                mb={2}
                leftIcon={<AiFillTrophy />}
                onClick={achievementModalOnOpen}
              >
                Award Achievement
              </Button>
            </FormControl>
          </Stack>
        </Box>
      )}
    </>
  );
}
