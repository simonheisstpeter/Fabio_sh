import { useRouter } from "next/router";
import NavItem from "./NavItem";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import ThemeChanger from "./ThemeChanger";
import ScrollToTop from "./ScrollToTop";
import MobileMenu from "./MobileMenu";
import Footer from "./Footer";
import { Analytics } from "@vercel/analytics/react";
import locales from "../locales";
import Loader from "./Loader";
import Link from "next/link";
import Head from "next/head";

export default function Container(props) {
  const { children } = props;

  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"];
  const isActive = router.asPath === "/";

  const changeLanguage = (event) => {
    const selectedLocale = event.target.value;
    router.push(router.pathname, router.asPath, {
      locale: selectedLocale,
    });
  };

  // dark mode
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
    <Head>
      <title>fabio.sh</title>
    </Head>
      <MobileMenu />
      <main className="z-10">
        {/* Desktop */}
        <nav className="hidden pr-10 pt-12 text-right md:block">
          <Link href={"/"} aria-current={isActive ? "page" : undefined} tabindex="0" className=" focus:outline-2 outline-emerald-400"     >
            <Loader />
          </Link>
          {/* <NavItem href="/" text={t.menuHome} /> */}
          <NavItem href="/projects" text={t.menuProjects} />
          <NavItem href="/about" text={t.menuAbout} />
          <NavItem href="/contact" text={t.menuContact} />
          <select
            onChange={changeLanguage}
            value={locale}
            className="text-shadow-sm mr-10 bg-transparent text-right tracking-wide dark:text-white font-andesNeueLight focus:outline-2 outline-emerald-400 rounded-md"
            aria-label={t.languageSelect}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="ja">日本語</option>
            <option value="pt">Portugués</option>
          </select>
          <ThemeChanger />
        </nav>

        {/* Main Content */}
        <section className="font-andesNeueLight">{children}</section>

        <ScrollToTop />
        <Footer />
      </main>
      <Analytics />
    </>
  );
}
