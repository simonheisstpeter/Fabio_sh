import Link from "next/link";
import React, { useState, useCallback, Fragment } from "react";
import { useRouter } from "next/router";
import NavItem from "./NavItem";
import ThemeChanger from "./ThemeChanger";
import de from "../locales/de";
import en from "../locales/en";
import es from "../locales/es";
import pt from "../locales/pt";
import ja from "../locales/ja";

const MobileMenu = () => {
  const router = useRouter();
  const { locale } = router;
  const t =
    locale === "de"
      ? de
      : locale === "en"
      ? en
      : locale === "es"
      ? es
      : locale === "ja"
      ? ja
      : pt;
  let href = "/";
  const isActive = router.asPath === href;
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleNav = useCallback(() => {
    setMenuOpen((v) => !v);
  }, []);

  const changeMobileLanguage = (e) => {
    const locale = e.target.value;
    router.push(router.pathname, router.asPath, { locale });
    // router.reload(window.location.pathname);
    toggleNav();
  };

  return (
    <nav className="w-full fixed top-0 text-center bg-white dark:bg-[#1c1b22] z-10 visible md:hidden">
      <button
        className="absolute w-8 h-8 text-gray-900 dark:text-white p-2 rounded right-6 top-6"
        onClick={() => toggleNav()}
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

      <div
        className={menuOpen ? "h-screen pt-32 dots dark:dotsDark" : "hidden"}
      >
        <div className="grid grid-cols-1 text-2xl">
          <NavItem onClick={() => toggleNav()} href="/" text={t.menuHome} />
          <NavItem
            onClick={() => toggleNav()}
            href="/projects"
            text={t.menuProjects}
          />
          <NavItem
            onClick={() => toggleNav()}
            href="/about"
            text={t.menuAbout}
          />
          <NavItem
            onClick={() => toggleNav()}
            href="/contact"
            text={t.menuContact}
          />
          <select
            onChange={changeMobileLanguage}
            defaultValue={locale}
            className="w-16 text-lg bg-transparent tracking-wide mx-auto mb-6 flex text-center"
          >
            <option value="de">🇩🇪</option>
            <option value="en">🇺🇸</option>
            <option value="es">🇪🇸</option>
            <option value="ja">🇯🇵</option>
            <option value="pt">🇧🇷</option>
          </select>
          <ThemeChanger />
        </div>
      </div>
    </nav>
  );
};

export default MobileMenu;
