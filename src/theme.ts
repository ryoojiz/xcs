import { modalAnatomy as parts } from '@chakra-ui/anatomy';
import { Modal, defineStyle, defineStyleConfig, extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { createMultiStyleConfigHelpers } from '@chakra-ui/styled-system';

const { defineMultiStyleConfig } = createMultiStyleConfigHelpers(parts.keys);

// styles

const unselected = defineStyle({
  background: 'gray.50',
  _hover: {
    background: 'gray.100'
  },
  _active: {
    background: 'gray.200'
  },
  _dark: {
    background: 'whiteAlpha.50',
    _hover: {
      background: 'whiteAlpha.300'
    },
    _active: {
      background: 'whiteAlpha.400'
    }
  }
});

const subtext = defineStyle({
  color: 'gray.500',
  _dark: {
    color: 'gray.400'
  }
});

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true
};

Modal.defaultProps = {
  // motionPreset: 'slideInBottom'
};

export const buttonTheme = defineStyleConfig({
  variants: { unselected },
  baseStyle: {
    textDecor: 'none !important'
  }
});

export const textTheme = defineStyleConfig({
  variants: { subtext },
  sizes: {
    '5xl': {
      fontSize: '2xl',
      lineHeight: '3xl'
    }
  }
});

const theme = {
  colors: {
    black: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#000',
      600: '#444',
      700: '#666',
      800: '#888',
      900: '#aaa'
    }
  },
  sizes: {
    container: {
      '2xl': '1400px'
    }
  },
  components: {
    Badge: {
      baseStyle: {
        textTransform: 'unset'
      }
    },
    Card: {
      baseStyle: {
        borderRadius: 'lg',
        boxShadow: 'unset'
      }
    },
    FormHelperText: {
      baseStyle: {
        color: 'gray.500',
        _dark: {
          color: 'gray.400'
        }
      }
    },
    Skeleton: {
      baseStyle: {
        borderRadius: 'lg'
      }
    },
    Text: textTheme,
    Button: buttonTheme,
    IconButton: buttonTheme,
    Link: {
      baseStyle: {
        textUnderlineOffset: 4,
        _hover: {
          opacity: 0.87
        },
        _active: {
          opacity: 0.75
        }
      }
    },
    Tooltip: {
      baseStyle: {
        backgroundColor: 'black',
        color: 'white',
        borderRadius: 'md',
        _dark: {
          backgroundColor: 'white',
          color: 'black'
        },
        boxShadow: 'none'
      }
    }
  },
  fonts: {
    heading: 'var(--font-familjen)',
    body: 'var(--font-familjen)'
  },
  config
};

export default extendTheme(theme);
