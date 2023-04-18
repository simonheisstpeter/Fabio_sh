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
      <nav className="visible fixed top-0 z-10 w-full bg-white text-center dark:bg-[#1c1b22] md:hidden">
        <button
          className="absolute right-6 top-6 h-8 w-8 rounded p-2 text-gray-900 dark:text-white"
          onClick={() => toggleMenu()}
          aria-haspopup="menu"
          aria-label="menu"
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
            <Link
              href="/"
              className="mb-6 bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent"
              onClick={() => toggleMenu()}
            >
              {t.menuHome}
            </Link>

            <Link
              href="/projects"
              className="mb-6 bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent"
              onClick={() => toggleMenu()}
            >
              {t.menuProjects}
            </Link>
            <Link
              href="/about"
              className="mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent"
              onClick={() => toggleMenu()}
            >
              {t.menuAbout}
            </Link>
            {/*
              <Link href="/fraktur">
                <a className="disabled mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-700">F wie Fraktur</a>             </Link>
            */}
            <Link
              href="/contact"
              className="mb-6 bg-gradient-to-r from-emerald-600 to-emerald-300 bg-clip-text text-transparent dark:to-emerald-500"
              onClick={() => toggleMenu()}
            >
              {t.menuContact}
            </Link>
            <select
              onChange={changeMobileLanguage}
              defaultValue={locale}
              className="text-shadow-sm text-md mx-auto mb-12 h-10 w-12 bg-transparent tracking-wide text-white"
            >
              <option className="w-20 text-black" value="de">
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

      <nav className="mt-12 hidden pr-10 text-right md:fixed md:block">
        <Link
          href="/"
          className="mx-4 inline-block transition duration-300 ease-in-out hover:text-emerald-300 hover:underline"
        >
          {t.menuHome}
        </Link>
        <Link
          href="/projects"
          className="mx-4 inline-block transition duration-300 ease-in-out hover:text-emerald-300 hover:underline"
        >
          {t.menuProjects}
        </Link>
        <Link
          href="/about"
          className="mx-4 inline-block transition duration-300 ease-in-out hover:text-emerald-400 hover:underline"
        >
          {t.menuAbout}
        </Link>
        {/*
        <Link href="/fraktur" className="mx-4 transition duration-300 ease-in-out hover:underline hover:text-emerald-500 inline-block opacity-50" aria-disabled>F wie Fraktur<
        </Link>
        */}
        <Link
          href="/contact"
          className="mx-4 inline-block transition duration-300 ease-in-out hover:text-emerald-600 hover:underline"
        >
          {t.menuContact}
        </Link>
        <select
          onChange={changeLanguage}
          defaultValue={locale}
          className="text-shadow-sm mr-10 w-16 bg-transparent text-right text-lg tracking-wide text-white"
        >
          <option className="text-black" value="de">
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
