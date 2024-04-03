import * as React from 'react';

import { Box, Checkbox, Flex, Text } from '@chakra-ui/react';


// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

import { ColumnDef } from '@tanstack/react-table';


type EventLog = {
  id: string;
  createdAt: string;
  type: string;
  access_point: string;
  status: 'success' | 'pending' | 'failed';
  scanner: React.ReactNode;
};

export const logs: EventLog[] = [
  {
    id: '728ed52f',
    createdAt: new Date().toISOString(),
    type: 'card_scan',
    access_point: 'Front Door',
    status: 'success',
    scanner: (
      <Text
        as="span"
        fontWeight="bold"
      >
        Eve Holloway
      </Text>
    )
  },
  {
    id: '728ed52e',
    createdAt: new Date().toISOString(),
    type: 'card_scan',
    access_point: 'Front Door',
    status: 'success',
    scanner: (
      <Text
        as="span"
        fontWeight="bold"
      >
        Eve Holloway
      </Text>
    )
  }
];

const columns: ColumnDef<EventLog>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        colorScheme="gray"
        isChecked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        colorScheme="gray"
        isChecked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(!!e.target.checked)}
        aria-label="Select row"
      />
    ),
    enableSorting: true,
    enableHiding: false
  },
  {
    accessorKey: 'type',
    header: 'Type'
  },
  {
    accessorKey: 'access_point',
    header: 'Access Point Name'
  },
  {
    accessorKey: 'scanner',
    header: 'Scanner Name'
  },
  {
    accessorKey: 'createdAt',
    header: 'Scan Date'
  },
  {
    accessorKey: 'status',
    header: 'Status'
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <></>
        // <DropdownMenu>
        //   <DropdownMenuTrigger asChild>
        //     <Button variant="ghost" className="h-8 w-8 p-0">
        //       <span className="sr-only">Open menu</span>
        //       <BsThreeDots />
        //     </Button>
        //   </DropdownMenuTrigger>
        //   <DropdownMenuContent
        //     align="end"
        //     className="rounded-xl overflow-hidden"
        //   >
        //     <DropdownMenuLabel>Actions</DropdownMenuLabel>
        //     <DropdownMenuItem
        //       className="cursor-pointer"
        //       onClick={() => navigator.clipboard.writeText(payment.id)}
        //     >
        //       Copy Event ID
        //     </DropdownMenuItem>
        //     <DropdownMenuSeparator />
        //     <DropdownMenuItem className="cursor-pointer">
        //       View user
        //     </DropdownMenuItem>
        //     <DropdownMenuItem className="cursor-pointer">
        //       View event details
        //     </DropdownMenuItem>
        //   </DropdownMenuContent>
        // </DropdownMenu>
      );
    }
  }
];

export default function LocationEventLogs() {
  return (
    <Box h={'100%'}>
      <Text
        as={'h1'}
        fontSize={'4xl'}
        fontWeight={'900'}
        mb={2}
      >
        Event Logs
      </Text>
      <Flex
        w={'full'}
        h={'max-content'}
      // rounded={"xl"}
      // border={"1px solid"}
      // borderColor={useColorModeValue("gray.300", "gray.700")}
      // p={4}
      >
      </Flex>
    </Box>
  );
}
