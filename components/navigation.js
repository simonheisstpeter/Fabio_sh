import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'
import { useTheme } from 'next-themes';

export default function Navigation () {
    const [menuOpen, setMenuOpen] = useState('hidden')

    const toggleMenu = useCallback(() => {
        setMenuOpen(v => !v);
      }, []);

    const [ mounted, setMounted ] = useState(false)
    const { theme, setTheme } = useTheme()


    // When mounted on client, now we can show the UI
    useEffect(() => setMounted(true), [])

    if (!mounted) return null
    
      
    return (
        <>
        {/* Mobile */}
      <nav className="w-full fixed top-0 text-center bg-white z-10 visible md:hidden focus:bg-red-400">
                <button className="absolute w-8 h-8 bg-white text-gray-900 p-2 rounded right-6 top-6" onClick={() => toggleMenu()}>
                    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
                </button>

                <div className={ menuOpen ? "hidden" : "visible h-screen pt-44"}>
                    <div className="grid grid-cols-1 text-2xl" onClick={() => toggleMenu()}>
                      <Link href="/">
                        <a className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-emerald-500">Home</a>
                      </Link>
                      
                      <Link href="/projects">
                        <a className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-emerald-500">Projekte</a>
                      </Link>
                      <Link href="/about">
                        <a className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">Über mich</a>
                      </Link>
                      {/*
                      <Link href="/fraktur">
                        <a className="disabled mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-700">F wie Fraktur</a>
                      </Link>
                      */}
 
                      <Link href="/contact">
                        <a className="mb-20 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-800">Kontakt</a>
                      </Link>
                      <button className={theme === 'dark' ? "block text-emerald-400 hover:text-emerald-600" : "hidden"} onClick={() => { toggleMenu(); setTheme('light'); }}>
                            <svg className="mb-6 text-emerald-400 mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </button>
                        <button className={theme === 'light' ? "block text-emerald-400 hover:text-emerald-600" : "hidden"} onClick={() => { toggleMenu(); setTheme('dark'); }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" id="moon" className="mb-6  mx-auto h-8 w-8"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        </button>  
                    </div>
                </div>
            </nav>

                  {/* Desktop */}

      <nav  className="mt-12 hidden md:block text-right pr-10">
        <button className={theme === 'dark' ? "hover:text-emerald-600" : "hidden"} onClick={() => setTheme('light')}>
            <svg className="md:left-14 xl:left-20 absolute h-6 w-6 transition duration-300 ease-in-out hover:text-emerald-200 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </button>
        <button className={theme === 'light' ? "hover:text-emerald-600" : "hidden"} onClick={() => setTheme('dark')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" id="moon" className="md:left-14 xl:left-20 absolute h-6 w-6 transition duration-300 ease-in-out hover:text-emerald-200 inline-block"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
        </button> 
        <Link href="/">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-300 inline-block">Home</a>
        </Link>
        <Link href="/projects">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-300 inline-block">Projekte</a>
        </Link>
        <Link href="/about">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-400 inline-block">Über mich</a>
        </Link>
        {/*
        <Link href="/fraktur">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-500 inline-block opacity-50" aria-disabled>F wie Fraktur</a>
        </Link>
        */}
        <Link href="/contact">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-600 inline-block">Kontakt</a>
        </Link>
        
      </nav>
        </>
    )
}