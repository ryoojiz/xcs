import Footer from "@/components/Footer";
import Nav from "@/components/nav/Nav";
import { Box } from "@chakra-ui/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Nav />
      {children}
      <Footer type={'public'} />
    </Box>
  )
}