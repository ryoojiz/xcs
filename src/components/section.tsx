import { chakra, shouldForwardProp } from '@chakra-ui/react';

import { motion } from 'framer-motion';

const StyledDiv = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    return shouldForwardProp(prop) || prop === 'transition';
  }
}) as any; // TS errors on transition prop

const Section = ({
  children,
  delay = 0,
  offset = 10,
  duration = 0.25
}: {
  children: React.ReactNode;
  delay?: Number;
  offset?: Number;
  duration?: Number;
}) => (
  <StyledDiv
    initial={{ y: offset, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: duration, delay }}
  >
    {children}
  </StyledDiv>
);

export default Section;
