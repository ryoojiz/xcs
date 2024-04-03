import Layout from "@/layouts/PublicLayout";
import { Container, Heading, Text } from "@chakra-ui/react";

export default function Blog() {
    return <Container maxW={'container.lg'} py={16}>
        <Heading>Blog</Heading>
        <Text variant={'subtext'}>
            Coming soon.
        </Text>
    </Container>
}

Blog.getLayout = (page: any) => <Layout>{page}</Layout>;
