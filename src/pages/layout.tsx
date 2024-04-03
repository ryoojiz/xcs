import Head from 'next/head';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Restrafes XCS"
        />
        <link
          rel="icon"
          href="/favicon.ico"
        />
        <meta
          property="og:site_name"
          content="Restrafes XCS"
        />
        <meta
          property="og:title"
          content="Restrafes XCS"
        />
        <meta
          property="og:type"
          content="website"
        />
        <meta
          property="og:url"
          content="https://xcs.restrafes.co/"
        />
        <meta
          property="og:image"
          content="/images/hero3.jpg"
        />
        <meta
          property="og:description"
          content="Control your access points with ease."
        />
      </Head>
      <main>{children}</main>
    </>
  );
}
