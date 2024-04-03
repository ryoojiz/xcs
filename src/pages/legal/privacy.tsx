import Footer from '@/components/Footer';
import Nav from '@/components/nav/Nav';
import { Box, Container, Heading, Link, Text, useColorModeValue } from '@chakra-ui/react';
import Head from 'next/head';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Restrafes XCS</title>
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
          Privacy Policy
        </Heading>
        <Box>
          <Text>
            RESTRAFES & CO (&quot;we&quot; or &quot;us&quot;) respects the privacy of its users (&quot;you&quot;). This
            Privacy Policy outlines how we collect, use, disclose, and protect your personal information.
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            Information Collection
          </Heading>

          <Text>
            We collect your name, email address, and other personal information you voluntarily provide to create an
            account and customize your experience. Payment information is collected and processed by our payment
            processor Stripe.
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            Information Use
          </Heading>

          <Text>
            The information we collect allows us to provide our services to you, customize your experience, communicate
            with you, provide customer support, and improve our services.
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            Cookies
          </Heading>

          <Text>
            We use cookies to remember your preferences and authenticate you. We do not use cookies to track your
            browsing activity across third party websites. You can disable cookies through your browser settings but the
            website may not function properly as a result.
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            Data Sharing
          </Heading>

          <Text>
            We do not share or sell your personal information to any third parties. Information may be disclosed if
            required by law or to cooperate with regulators or law enforcement authorities.
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            Minor Privacy
          </Heading>

          <Text>
            Our services are not directed at children under 13. We do not knowingly collect personal information from
            children under 13. If we become aware that a child under 13 has provided us with personal information, we
            will delete such information from our systems. Users must be over the age of 13 to use our services. If you
            are between 13 and 18 years old, you may only use our services with the consent of a parent
            or legal guardian.
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            Data Security
          </Heading>

          <Text>
            We have implemented technical and organizational security measures to protect your information against
            unauthorized access, disclosure, alteration or destruction. User authentication is handled by Google Cloud
            Identity services.
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            User Rights
          </Heading>

          <Text>
            At any time, you have the right to request access to the personal information we collect or delete your
            account by emailing <Link href="mailto:xcs@restrafes.co">xcs@restrafes.co</Link> with the subject line, &quot;Account Deletion Request.&quot;. Event logs are retained for up to 6 months before deletion.
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            Breach Notification
          </Heading>

          <Text>
            If we become aware that your information has been compromised, we will notify you via email within 72 hours.
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            Contact Us
          </Heading>

          <Text>
            If you have any questions about this Privacy Policy or our privacy practices, please email us at{" "}
            <Link href="mailto:xcs@restrafes.co">xcs@restrafes.co</Link>
          </Text>

          <Heading
            as="h2"
            size="md"
            mt={4}
          >
            Changes to Policy
          </Heading>

          <Text>
            We may periodically update this policy. We will notify you of any material changes via email or on our
            website. Your continued use of our services after any changes indicates your acceptance of the new terms.
          </Text>
        </Box>
      </Container>
      <Footer />
    </>
  );
}
