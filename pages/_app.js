import Head from 'next/head'
import "tailwindcss/tailwind.css";
import Navigation from '../components/navigation';
import { ThemeProvider } from 'next-themes'

export default function MyApp({ Component, pageProps }) {

  return (
    <>
      <Head>
        <title>fabio</title>
        <link rel="icon" href="/carp_streamer.ico" />

        <meta name="Title" content="Fabio Gschweidl"/>
        <meta name="Author" content="Fabio Gschweidl"/>
        <meta name="Publisher" content="Fabio Gschweidl"/>
        <meta name="Copyright" content="Fabio Gschweidl"/>
        <meta name="Revisit" content="After 5 days"/>
        <meta name="Keywords" content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign"/>
        <meta name="Description" content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign"/>
        <meta name="Abstract" content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign"/>
        <meta name="page-topic" content="Medien"/>
        <meta name="page-topic" content="Private Homepage"/>
        <meta name="audience" content="Erwachsene"/>
        <meta name="Robots" content="INDEX,FOLLOW"/>
        <meta name="Language" content="de"/>

        <meta property="og:title" content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign" />
        <meta property="og:image" content="/meta_pic.png" />
        <meta property="og:description" content="Coming soon ..." />
        <meta property="og:type" content="Website" />
        <meta property="og:site_name" content="Fabio Gschweidl" />
        <meta property="og:url" content="https://fabio.sh" />
      </Head>

      <ThemeProvider attribute="class">
        <Navigation />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}
