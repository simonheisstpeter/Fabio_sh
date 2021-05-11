import Head from 'next/head'
import Link from 'next/link'
import "tailwindcss/tailwind.css";
import React, { useState, useCallback } from 'react';

export default function MyApp({ Component, pageProps }) {
  const [menuOpen, setMenuOpen] = useState('hidden')

  const toggle = useCallback(() => {
      setMenuOpen(v => !v);
    }, []);



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
      {/* Mobile */}
      <nav className="w-full p-6 fixed top-0 text-center bg-white z-10 visible md:hidden focus:bg-red-400">
                <button className="absolute w-8 h-8 bg-white text-gray-900 p-2 rounded right-6" onClick={() => toggle()}>
                    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
                </button>

                <div className={ menuOpen ? "hidden" : "visible h-screen pt-44"}>
                    <div className="grid grid-cols-1 m-6" onClick={() => toggle()}>
                      <Link href="/">
                       <a className="mb-6">Home</a>
                      </Link>
                      <Link href="/projects">
                        <a className="mb-6">Projekte</a>
                      </Link>
                      <Link href="/about">
                        <a className="mb-6">Über mich</a>
                      </Link>
                      <Link href="/fraktur">
                        <a className="mb-6">F wie Fraktur</a>
                      </Link>
                    </div>
                </div>
            </nav>

                  {/* Desktop */}

      <nav  className="mt-12 text-right container hidden md:visible">
        <Link href="/">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-green-200">Home</a>
        </Link>
        <Link href="/projects" className="">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-green-300">Projekte</a>
        </Link>
        <Link href="/about" className="">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-green-400">Über mich</a>
        </Link>
        <Link href="/fraktur" className="">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-green-500">F wie Fraktur</a>
        </Link>
      </nav>
      <main>
        <Component {...pageProps} />
      </main>
    </>
  )
}
