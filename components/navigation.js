import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import ThemeChanger from "./ThemeChanger";
import { useRouter } from "next/router";

import de from "../locales/de/menu";
import en from "../locales/en/menu";

export default function Navigation() {
  const router = useRouter();
  const { locale } = useRouter();
  const t = locale === "de" ? de : en;

  const changeLanguage = (e) => {
    const locale = e.target.value;
    router.push(router.pathname, router.asPath, { locale });
    // router.reload(window.location.pathname);
  };
  const changeMobileLanguage = (e) => {
    const locale = e.target.value;
    router.push(router.pathname, router.asPath, { locale });
    // router.reload(window.location.pathname);
    toggleMenu();
  };

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

        <div className={menuOpen ? "visible h-screen pt-44" : "hidden"}>
          <div className="grid grid-cols-1 text-2xl">
            <Link href="/">
              <a
                className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-emerald-500"
                onClick={() => toggleMenu()}
              >
                {t.menuHome}
              </a>
            </Link>

            <Link href="/projects">
              <a
                className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-emerald-500"
                onClick={() => toggleMenu()}
              >
                {t.menuProjects}
              </a>
            </Link>
            <Link href="/about">
              <a
                className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600"
                onClick={() => toggleMenu()}
              >
                {t.menuAbout}
              </a>
            </Link>
            {/*
              <Link href="/fraktur">
                <a className="disabled mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-700">F wie Fraktur</a>             </Link>
            */}
            <Link href="/contact">
              <a
                className="mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-300 dark:to-emerald-500"
                onClick={() => toggleMenu()}
              >
                {t.menuContact}
              </a>
            </Link>
            <select
              onChange={changeMobileLanguage}
              defaultValue={locale}
              className="w-12 h-10 text-white text-shadow-sm text-md bg-transparent tracking-wide mx-auto mb-20"
            >
              <option className="text-black w-20" value="de">
                🇩🇪
              </option>
              <option className="text-black" value="en">
                🇺🇸
              </option>
            </select>
            <ThemeChanger />
          </div>
        </div>
      </nav>

      {/* Desktop */}

      <nav className="mt-12 hidden md:block text-right pr-10">
        <Link href="/">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-300 inline-block">
            {t.menuHome}
          </a>
        </Link>
        <Link href="/projects">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-300 inline-block">
            {t.menuProjects}
          </a>
        </Link>
        <Link href="/about">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-400 inline-block">
            {t.menuAbout}
          </a>
        </Link>
        {/*
        <Link href="/fraktur">
          <a className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-500 inline-block opacity-50" aria-disabled>F wie Fraktur</a>
        </Link>
        */}
        <Link href="/contact">
          <a className="mx-4 mr-10 transition duration-300 ease-in-out hover:underline hover:text-emerald-600 inline-block">
            {t.menuContact}
          </a>
        </Link>
        <select
          onChange={changeLanguage}
          defaultValue={locale}
          className="w-16 text-right text-white text-shadow-sm text-lg bg-transparent tracking-wide mr-10"
        >
          <option className="text-black w-20" value="de">
            🇩🇪
          </option>
          <option className="text-black" value="en">
            🇺🇸
          </option>
        </select>
        <ThemeChanger />
      </nav>
    </>
  );
}
