/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState } from 'react';

import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  HStack,
  Input,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react';

import { MdOutlineAddCircle } from 'react-icons/md';

import { Select } from 'chakra-react-select';
import NextLink from 'next/link';

import CreateAccessPointDialog from '@/components/CreateAccessPointDialog';
import { useAuthContext } from '@/contexts/AuthContext';

export default function LocationAccessPoints({ idToken, location, refreshData }: any) {
  const [accessPoints, setAccessPoints] = useState<any>(null);
  const [selectedTags, setSelectedTags] = useState<any>([]);
  const [tags, setTags] = useState<any>([]);
  const [tagsOptions, setTagsOptions] = useState<any>([]); // [{ value: 'tag', label: 'tag' }
  const [nameFilter, setNameFilter] = useState<string>('');
  const toast = useToast();
  const { user } = useAuthContext();

  const {
    isOpen: isCreateAccessPointModalOpen,
    onOpen: onCreateAccessPointModalOpen,
    onClose: onCreateAccessPointModalClose
  } = useDisclosure();

  // get tags
  useEffect(() => {
    if (!accessPoints) return;
    let res = [] as string[];
    accessPoints?.accessPoints?.forEach((accessPoint: any) => {
      res = [...res, ...(accessPoint?.tags || [])];
    });
    res = [...new Set(res as any) as any];
    setTags(res);
    setTagsOptions([
      ...(new Set(
        res.map((value: string) => {
          return {
            value,
            label: value as string
          };
        })
      ) as any)
    ]);
  }, [accessPoints]);

  useEffect(() => {
    if (!location) return;
    if (!user) return;
    user.getIdToken().then((token: string) => {
      fetch(`/api/v1/locations/${location.id}/access-points`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.status === 200) return res.json();
          throw new Error(`Failed to fetch access points. (${res.status})`);
        })
        .then((data) => {
          setAccessPoints(data);
        })
        .catch((err) => {
          toast({
            title: 'Error',
            description: err.message,
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        });
    });
  }, [location, user]);

  return (
    <>
      <CreateAccessPointDialog
        isOpen={isCreateAccessPointModalOpen}
        onClose={onCreateAccessPointModalClose}
        location={location}
        onCreate={refreshData}
        accessPoints={accessPoints?.accessPoints || []}
      />
      <Text
        as={'h1'}
        fontSize={'4xl'}
        fontWeight={'900'}
        mb={2}
      >
        Access Points
      </Text>
      <Stack
        mb={4}
        direction={{ base: 'column', md: 'row' }}
      >
        <Button
          leftIcon={<MdOutlineAddCircle />}
          onClick={onCreateAccessPointModalOpen}
          isDisabled={accessPoints?.self?.role <= 1}
        >
          New Access Point
        </Button>
        <FormControl w={{ base: 'full', md: 'fit-content' }}>
          <Input
            placeholder="Search"
            variant={'filled'}
            onChange={(e) => {
              setNameFilter(e.target.value);
            }}
            value={nameFilter}
          />
        </FormControl>
        <FormControl w={{ base: 'full', md: 'fit-content' }} h={'min-content'}>
          <Select
            options={tagsOptions}
            placeholder="Filter by Tags"
            onChange={(value) => {
              setSelectedTags(value);
            }}
            variant={'filled'}
            value={selectedTags}
            isMulti
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            selectedOptionStyle={'check'}
          />
        </FormControl>
      </Stack>
      <Flex
        as={Stack}
        direction={'row'}
        h={'full'}
        spacing={4}
        overflow={'auto'}
        flexWrap={'wrap'}
      >
        {accessPoints && accessPoints?.accessPoints?.length > 0 ? (
          <Flex
            as={Stack}
            direction={'row'}
            h={'full'}
            spacing={4}
            overflow={'auto'}
            flexWrap={'wrap'}
          >
            {!accessPoints
              ? Array.from({ length: 6 }).map((_, i) => (
                <Box
                  key={i}
                  as={Skeleton}
                  w={{ base: 'full', md: '384px' }}
                  h={'max-content'}
                  py={4}
                  px={8}
                  borderWidth={1}
                  borderRadius={'lg'}
                  borderColor={useColorModeValue('gray.200', 'gray.700')}
                >
                  <HStack
                    p={2}
                    w={'full'}
                  >
                    <Box flexGrow={1}>
                      <Text
                        fontSize={'2xl'}
                        fontWeight={'bold'}
                      >
                        Loading...
                      </Text>
                      <Text color={'gray.500'}>0 Members</Text>
                      <Text color={'gray.500'}>Owned by</Text>
                      <Text>Organization</Text>
                    </Box>
                  </HStack>
                </Box>
              ))
              : null}
            {accessPoints?.accessPoints
              ?.filter(
                (accessPoint: any) =>
                  (!selectedTags.length || selectedTags.every((tag: any) => accessPoint?.tags?.includes(tag.value))) &&
                  (!nameFilter || accessPoint?.name?.toLowerCase().includes(nameFilter.toLowerCase()))
              )
              .map((accessPoint: any) => (
                <Flex
                  direction={'column'}
                  justify={'space-between'}
                  key={accessPoint.id}
                  w={{ base: 'full', md: '384px' }}
                  p={6}
                  borderWidth={1}
                  borderRadius={'lg'}
                  borderColor={useColorModeValue('gray.200', 'gray.700')}
                >
                  <Text
                    fontSize={'xl'}
                    fontWeight={'bold'}
                    noOfLines={1}
                    mb={1}
                  >
                    {accessPoint?.name}
                  </Text>
                  <HStack
                    align={'center'}
                    justify={'flex-start'}
                    fontSize={'xl'}
                    mt={1}
                  >
                    {accessPoint?.config?.active ? (
                      <Badge colorScheme={'green'}>Active</Badge>
                    ) : (
                      <Badge colorScheme={'red'}>Inactive</Badge>
                    )}
                    {accessPoint?.config?.armed ? (
                      <Badge colorScheme={'black'}>Armed</Badge>
                    ) : (
                      <Badge colorScheme={'red'}>Not Armed</Badge>
                    )}
                  </HStack>
                  {accessPoint?.tags?.length ? (
                    <Flex
                      flexWrap={'wrap'}
                      pt={1}
                      gap={2}
                    >
                      {accessPoint?.tags?.map((tag: string) => (
                        <Badge
                          key={tag}
                          colorScheme={'gray'}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </Flex>
                  ) : <>

                  </>}
                  <Box mb={'auto'}>
                    {accessPoint.description ? (
                      <Text pt={1}>{accessPoint.description}</Text>
                    ) : (
                      <Text
                        pt={1}
                        color={'gray.500'}
                      >
                        No description available.
                      </Text>
                    )}
                  </Box>
                  <Button
                    mt={4}
                    as={NextLink}
                    href={`/access-points/${accessPoint.id}`}
                    variant={'solid'}
                    w={'full'}
                  >
                    View
                  </Button>
                </Flex>
              ))}
          </Flex>
        ) : (
          <Text>
            This location does not have any access points yet.{' '}
            {accessPoints?.self?.role >= 2 ? (
              <>
                <Text as={'span'}>
                  <Button
                    variant={'link'}
                    color={'unset'}
                    textDecor={'underline'}
                    textUnderlineOffset={4}
                    onClick={onCreateAccessPointModalOpen}
                    _hover={{
                      color: useColorModeValue('gray.600', 'gray.400')
                    }}
                  >
                    Create one
                  </Button>
                </Text>{' '}
                to get started.
              </>
            ) : (
              <></>
            )}
          </Text>
        )}
      </Flex>
    </>
  );
}
