import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
import NavItem from "./NavItem";
import ThemeChanger from "./ThemeChanger";
import locales from "../locales";

const MobileMenu = () => {
  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"];

  const [menuOpen, setMenuOpen] = useState(false);

  const toggleNav = useCallback(() => {
    setMenuOpen((prevMenuOpen) => !prevMenuOpen);
  }, []);

  const changeMobileLanguage = (event) => {
    const selectedLocale = event.target.value;
    router.push(router.pathname, router.asPath, { locale: selectedLocale });
    toggleNav();
  };

  return (
    <nav className="fixed top-0 z-10 w-full bg-white text-center dark:bg-[#1c1b22] md:hidden" aria-label="mobile menu">
      <button
        className="absolute right-6 top-6 h-8 w-8 rounded p-2 text-gray-900 dark:text-white"
        onClick={toggleNav}
        aria-haspopup="menu"
        aria-expanded={menuOpen ? "true" : "false"}
        aria-label="Toggle Menu"
        aria-controls="mobile-menu"
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

      {menuOpen && (
        <div
          className="dots dark:dotsDark h-screen pt-32"
          id="mobile-menu"
          aria-live="assertive"
        >
          <div className="grid grid-cols-1 text-2xl">
            <NavItem onClick={toggleNav} href="/" text={t.menuHome} />
            <NavItem
              onClick={toggleNav}
              href="/projects"
              text={t.menuProjects}
            />
            <NavItem onClick={toggleNav} href="/about" text={t.menuAbout} />
            <NavItem
              onClick={toggleNav}
              href="/contact"
              text={t.menuContact}
            />
            <select
              onChange={changeMobileLanguage}
              value={locale}
              className="mx-auto translate-x-2 mb-6 flex w-12 bg-transparent text-center text-lg tracking-wide hover:text-green-500 duration-200"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="ja">日本語</option>
              <option value="pt">Portugués</option> 
            </select>
            <ThemeChanger />
          </div>
        </div>
      )}
    </nav>
  );
};

export default MobileMenu;
