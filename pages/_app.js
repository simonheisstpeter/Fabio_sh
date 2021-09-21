import Head from 'next/head'
import Link from 'next/link'
import "tailwindcss/tailwind.css";
import React, { useState, useCallback } from 'react';
import { SunIcon } from '@iconicicons/react'

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
      <nav className="w-full fixed top-0 text-center bg-white z-10 visible md:hidden focus:bg-red-400">
                <button className="absolute w-8 h-8 bg-white text-gray-900 p-2 rounded right-6 top-6" onClick={() => toggle()}>
                    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
                </button>

                <div className={ menuOpen ? "hidden" : "visible h-screen pt-44"}>
                    <div className="grid grid-cols-1 text-2xl" onClick={() => toggle()}>
                      <Link href="/">
                       <SunIcon className="mb-6 text-green-400 mx-auto h-8 w-8"/>
                      </Link>
                      <Link href="/projects">
                        <a className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-green-500">Projekte</a>
                      </Link>
                      <Link href="/about">
                        <a className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600">Über mich</a>
                      </Link>
                      {/*
                      <Link href="/fraktur">
                        <a className="disabled mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-700">F wie Fraktur</a>
                      </Link>
                      */}
                      <Link href="/contact">
                        <a className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-800">Kontakt</a>
                      </Link>
                    </div>
                </div>
            </nav>

                  {/* Desktop */}

      <nav  className="mt-12 hidden md:block text-right pr-10">
        <Link href="/">
          <a className="md:left-14 xl:left-20 absolute h-4 w-4 transition duration-300 ease-in-out hover:text-green-200 inline-block"><SunIcon /></a>
        </Link>
        <Link href="/projects">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-green-300 inline-block">Projekte</a>
        </Link>
        <Link href="/about">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-green-400 inline-block">Über mich</a>
        </Link>
        {/*
        <Link href="/fraktur">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-green-500 inline-block opacity-50" aria-disabled>F wie Fraktur</a>
        </Link>
        */}
        <Link href="/contact">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-green-600 inline-block">Kontakt</a>
        </Link>
      </nav>
      <main>
        <Component {...pageProps} />
      </main>
    </>
  )
}
