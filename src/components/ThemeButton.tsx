import { forwardRef } from 'react';

import { Button, IconButton, Link, MenuItem, useColorMode } from '@chakra-ui/react';

import { MoonIcon, SunIcon } from '@chakra-ui/icons';

import NextLink from 'next/link';

// eslint-disable-next-line react/display-name
const MenuLink = forwardRef((props: any, ref: any) => (
  <Link
    _hover={{ textDecor: 'unset' }}
    ref={ref}
    {...props}
  />
));

export default function ThemeButton({ menu }: { menu?: boolean }) {
  const { colorMode, toggleColorMode } = useColorMode();
  return !menu ? (
    <IconButton
      aria-label={'Theme'}
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
    />
  ) : (
    <MenuItem
      as={MenuLink}
      closeOnSelect={false}
      w={'full'}
      aria-label={'Theme'}
      onClick={toggleColorMode}
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      alignContent={'center'}
      justifyContent={'center'}
    >
      Toggle {colorMode === 'light' ? 'Dark' : 'Light'}
    </MenuItem>
  );
}
