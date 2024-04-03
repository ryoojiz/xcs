/* eslint-disable react-hooks/rules-of-hooks */
import { forwardRef } from 'react';

import { IconButton, Link, useColorMode, useColorModeValue } from '@chakra-ui/react';

import { MoonIcon, SunIcon } from '@chakra-ui/icons';


// eslint-disable-next-line react/display-name
const MenuLink = forwardRef((props: any, ref: any) => (
  <Link
    _hover={{ textDecor: 'unset' }}
    ref={ref}
    {...props}
  />
));

export default function ThemeButtonPublic({ menu }: { menu?: boolean }) {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      aria-label={'Theme'}
      icon={colorMode === 'light' ? <MoonIcon h={'full'} /> : <SunIcon h={'full'} />}
      onClick={toggleColorMode}
      variant={'unstyled'}
      border={'1px solid'}
      borderColor={useColorModeValue('blackAlpha.900', 'white')}
      borderRadius={'none'}
      transition={'all 0.2s ease'}
      _hover={{
        bg: useColorModeValue('blackAlpha.900', 'white'),
        color: useColorModeValue('white', 'black')
      }}
      _active={{
        bg: useColorModeValue('blackAlpha.700', 'whiteAlpha.700'),
        color: useColorModeValue('white', 'black')
      }}
    />
  );
}
