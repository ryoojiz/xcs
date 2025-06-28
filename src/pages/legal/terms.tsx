import Footer from '@/components/Footer';
import Nav from '@/components/nav/Nav';
import { Box, Container, Heading, Link, ListItem, OrderedList, Text, useColorMode, useColorModeValue } from '@chakra-ui/react';
import Head from 'next/head';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Use - Amperra Wyre</title>
      </Head>
      <Nav />
      <Box bg={useColorModeValue('black', 'white')} w={'full'} h={'240px'} />
      <Container
        maxW={'container.md'}
        py={16}
      >
        <Heading
          as="h1"
          size="xl"
          mb={4}
        >
          Terms of Use
        </Heading>
        <Box>
          <Text pb={4}>
            These terms of use govern your use of the Amperra Wyre website, products, and services (collectively
            &quot;Services&quot;) available at <Link href="https://wyre.ryj.my.id">wyre.ryj.my.id</Link>. By
            accessing or using the Services, you agree to be bound by these terms. If you do not agree to these terms,
            do not access or use the Services.
          </Text>

          <OrderedList>
            <ListItem>
              <Text as="span">
                You must be at least 13 years old to use the Services. If you are under 18 years old, you may only use
                the Services with the consent of a parent or legal guardian.
              </Text>
            </ListItem>

            <ListItem>
              <Text as="span">
                To access certain features and functions, you may be required to register and create an account. When
                you register, you agree to provide accurate and complete information about yourself. You are solely
                responsible for activity that occurs under your account. You must safeguard your account credentials and
                notify us immediately of any unauthorized use.
              </Text>
            </ListItem>

            <ListItem>
              <Text as="span">
                The Services contain copyrighted material, trademarks and other proprietary information including text,
                software, photos, videos, graphics and logos. This intellectual property is owned by Amperra Wyre or
                its licensors and protected by copyright and other laws. All rights are reserved. You may not modify,
                publish, transmit, distribute, publicly perform or display, sell or create derivative works of such
                content.
              </Text>
            </ListItem>

            <ListItem>
              <Text as="span">
                You agree not to use the Services for any unlawful purpose or in a manner inconsistent with these terms.
                You must comply with all applicable laws and regulations. You agree not to upload or transmit any
                content that infringes the rights of others. Any unauthorized or prohibited use may result in
                termination of your account and access to the Services.
              </Text>
            </ListItem>

            <ListItem>
              <Text as="span">
                We reserve the right to terminate your account or access to the Services at any time without notice for
                any reason. You may cancel your account at any time by contacting us at{' '}
                <Link href="mailto:xcs@restrafes.co">xcs@restrafes.co</Link>. Upon any termination, your right to use
                the Services will immediately cease.
              </Text>
            </ListItem>

            <ListItem>
              <Text as="span">
                THE SERVICES ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND. WE DISCLAIM ALL WARRANTIES,
                EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                NON-INFRINGEMENT.
              </Text>
            </ListItem>

            <ListItem>
              <Text as="span">
                We reserve the right to modify these terms from time to time. Your continued use of the Services
                constitutes acceptance of any modifications. You should review these terms periodically for updates.
              </Text>
            </ListItem>

            <ListItem>
              <Text as="span">
                These terms are governed by the laws of the State of Virginia without regard to conflict of law
                principles. Any dispute arising from these terms shall be resolved exclusively in the state or federal
                courts located in Virginia.
              </Text>
            </ListItem>

            <ListItem>
              <Text as="span">
                These terms constitute the entire agreement between you and Amperra Wyre with respect to your use of
                the Services. They supersede any prior agreements.
              </Text>
            </ListItem>

            <ListItem>
              <Text as="span">
                If you have any questions about these terms or the Services, please contact us at:{' '}
                <Link href="mailto:xcs@restrafes.co">xcs@restrafes.co</Link>
              </Text>
            </ListItem>
          </OrderedList>
        </Box>
      </Container>
      <Footer />
    </>
  );
}
