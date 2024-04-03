import { Avatar, Tooltip, useColorModeValue } from "@chakra-ui/react";

export const TooltipAvatar: typeof Avatar = (props: any) => (
  <Tooltip label={props.name}>
    <Avatar {...props} bg={useColorModeValue('gray.200', 'gray.700')} />
  </Tooltip>
);