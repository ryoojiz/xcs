/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Avatar,
  Button,
  ButtonGroup,
  Flex,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';

import { Link } from '@chakra-ui/next-js';

import { useAuthContext } from '@/contexts/AuthContext';
import { Organization, OrganizationInvitation } from '@/types';
import { useRouter } from 'next/router';
import { BiRefresh } from 'react-icons/bi';

const moment = require('moment');

function TableEntry({ key, invitation, skeleton, action }: { key: number | string, invitation?: OrganizationInvitation, skeleton?: boolean, action: any }) {
  const toRelativeTime = useMemo(() => (date: any) => {
    return moment(new Date(date)).fromNow();
  }, []);

  return <>
    <Tr key={key}>
      <Td>
        <Skeleton isLoaded={!skeleton}>
          <Flex align={'center'} gap={4}>
            <Avatar as={Link} href={`/@${invitation?.recipient?.username}`} target='_blank' transition={'opacity 0.2s ease-out'} _hover={{ opacity: 0.75 }} _active={{ opacity: 0.5 }} size={'md'} src={invitation?.recipient?.avatar || '/images/default-avatar.png'} />
            <Flex flexDir={'column'} justify={'center'}>
              <Skeleton isLoaded={!skeleton}>
                <Text fontWeight={'bold'}>
                  {!skeleton ? invitation?.recipient?.displayName : "N/A"}
                </Text>
              </Skeleton>
              <Skeleton isLoaded={!skeleton}>
                <Text
                  variant={'subtext'}
                  color="gray.500"
                >
                  @{invitation?.recipient?.username}
                </Text>
              </Skeleton>
            </Flex>
          </Flex>
        </Skeleton>
      </Td>
      <Td>
        <Skeleton isLoaded={!skeleton}>
          <Text>
            {!skeleton ? toRelativeTime(invitation?.createdAt) : 'N/A'}
          </Text>
        </Skeleton>
      </Td>
      <Td>
        <Skeleton isLoaded={!skeleton}>
          <Flex align={'center'} gap={2}>
            <Avatar as={Link} href={`/@${invitation?.createdBy?.username}`} target='_blank' transition={'opacity 0.2s ease-out'} _hover={{ opacity: 0.75 }} _active={{ opacity: 0.5 }} size={'sm'} mr={2} src={invitation?.createdBy?.avatar || '/images/default-avatar.png'} />
            <Flex flexDir={'column'} justify={'center'}>
              <Text fontWeight={'bold'}>
                {!skeleton ? invitation?.createdBy?.displayName : "N/A"}
              </Text>
              <Text
                variant={'subtext'}
                color="gray.500"
              >
                @{invitation?.createdBy?.username}
              </Text>
            </Flex>
          </Flex>
        </Skeleton>
      </Td>
      <Td isNumeric>
        <Skeleton isLoaded={!skeleton}>
          <ButtonGroup>
            <Button
              onClick={() => { action(invitation, 'withdraw') }}
              size={"sm"}
              variant={"solid"}
              colorScheme='red'
              textDecor={"unset !important"}
            >
              Withdraw
            </Button>
          </ButtonGroup>
        </Skeleton>
      </Td>
    </Tr>
  </>
}

export default function OrganizationInvitationsModal({
  isOpen,
  onClose,
  organization,
  onRefresh
}: {
  isOpen: boolean;
  onClose: () => void;
  organization?: Organization | null;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const { push } = useRouter();
  const { user } = useAuthContext();
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);

  const fetchInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    user.getIdToken().then(async (token: string) => {
      await fetch(`/api/v1/organizations/${organization?.id}/invitations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).then(async (res) => {
        const data = await res.json();
        if (res.status === 200) {
          setInvitations(data || []);
        } else {
          toast({
            title: "There was an error fetching the organization's invitations.",
            description: data.message,
            status: "error",
            duration: 9000,
            isClosable: true,
          });
        }
      }).finally(() => {
        setInvitationsLoading(false);
      });
    });
  }, [user, toast, organization]);

  const actOnInvitation = useCallback(async (invitation: OrganizationInvitation, action: 'withdraw') => {
    setInvitationsLoading(true);
    await user.getIdToken().then(async (token: string) => {
      await fetch(`/api/v1/organizations/${organization?.id}/invitations/${invitation.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).then(async (res) => {
        const data = await res.json();
        if (res.status === 200) {
          await fetchInvitations();
          toast({
            title: data.message,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } else {
          toast({
            title: "There was an error taking action on an invitation.",
            description: data.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }).finally(() => {
        setInvitationsLoading(false);
      });
    });
  }, [user, toast, fetchInvitations, organization?.id]);

  useEffect(() => {
    if (!user) return;
    if (!organization) return;
    if (!isOpen) return;
    fetchInvitations();
  }, [user, fetchInvitations, organization, isOpen]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        size={'4xl'}
      >
        <ModalOverlay />
        <ModalContent bg={useColorModeValue('white', 'gray.800')}>
          <ModalHeader pb={2}>Invitations</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4} minH={'xl'}>
            <Flex pb={4}>
              <Tooltip label={'Refresh'} placement={'top'}>
                <IconButton ml={'auto'} onClick={fetchInvitations} aria-label={'Refresh'} icon={<Icon as={BiRefresh} />} />
              </Tooltip>
            </Flex>
            <TableContainer overflow={'auto'} maxH={'md'}>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Recipient</Th>
                    <Th>Invite Date</Th>
                    <Th>Inviter</Th>
                    <Th isNumeric>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {
                    invitationsLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableEntry key={i} invitation={undefined} skeleton={true} action={actOnInvitation} />
                      ))
                    ) : (invitations.map((invitation: OrganizationInvitation) => (
                      <TableEntry key={invitation.id as string} invitation={invitation} skeleton={false} action={actOnInvitation} />
                    )))
                  }
                </Tbody>

              </Table>
            </TableContainer>
            {
              !invitationsLoading && invitations.length === 0 && (
                <Text py={8} w={'full'} textAlign={'center'} color={'gray.500'}>
                  There are no outgoing invitations.
                </Text>
              )
            }
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
