import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import ThemeChanger from "./ThemeChanger";
import { useRouter } from "next/router";

export default function Navigation() {
  const { locale, locales, defaultLocale } = useRouter();
  // const t = locale === "de" ? de : en;

  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen((v) => !v);
  }, []);

  // dark mode
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      {/* Mobile */}
      <nav className="w-full fixed top-0 text-center bg-white dark:bg-[#1c1b22] z-10 visible md:hidden">
        <button
          className="absolute w-8 h-8 text-gray-900 dark:text-white p-2 rounded right-6 top-6"
          onClick={() => toggleMenu()}
        >
          <svg
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>

        <div
          className={menuOpen ? "hidden" : "visible h-screen pt-44"}
          onClick={() => toggleMenu()}
        >
          <div className="grid grid-cols-1 text-2xl">
            <Link href="/">
              <a className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-emerald-500">
                Home
              </a>
            </Link>

            <Link href="/projects">
              <a className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-emerald-500">
                Projekte
              </a>
            </Link>
            <Link href="/about">
              <a className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
                Über mich
              </a>
            </Link>
            {/*
                      <Link href="/fraktur">
                        <a className="disabled mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-700">F wie Fraktur</a>
                      </Link>
                      */}

            <Link href="/contact">
              <a className="mb-20 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-300 dark:to-emerald-500">
                Kontakt
              </a>
            </Link>
            <ThemeChanger />
          </div>
        </div>
      </nav>

      {/* Desktop */}

      <nav className="mt-12 hidden md:block text-right pr-10">
        <Link href="/">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-300 inline-block">
            Home
          </a>
        </Link>
        <Link href="/projects">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-300 inline-block">
            Projekte
          </a>
        </Link>
        <Link href="/about">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-400 inline-block">
            Über mich
          </a>
        </Link>
        {/*
        <Link href="/fraktur">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-500 inline-block opacity-50" aria-disabled>F wie Fraktur</a>
        </Link>
        */}
        <Link href="/contact">
          <a className="mx-4 mr-10 transition duration-300 ease-in-out hover:underline hover:text-emerald-600 inline-block">
            Kontakt
          </a>
        </Link>
        <ThemeChanger />
      </nav>
    </>
  );
}
