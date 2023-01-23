import { useRouter } from "next/router";
import NavItem from "./NavItem";
import de from "../locales/de/menu";
import en from "../locales/en/menu";
import Footer from "./Footer";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import ThemeChanger from "./ThemeChanger";
import ScrollToTop from "./ScrollToTop";
import MobileMenu from "./MobileMenu";

export default function Container(props) {
  const { children } = props;

  const router = useRouter();
  const { locale } = router;
  const t = locale === "de" ? de : en;
  let href = "/";
  const isActive = router.asPath === href;

  const changeLanguage = (e) => {
    const locale = e.target.value;
    router.push(router.pathname, router.asPath, {
      locale,
    });
    //.then(() => router.reload());
  };

  // dark mode
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <body className="opacity-100">
        <MobileMenu />
        {/* Desktop */}

        <nav className="pt-12 hidden md:block text-right pr-10">
          <NavItem href="/" text={t.menuHome} />
          <NavItem href="/projects" text={t.menuProjects} />
          <NavItem href="/about" text={t.menuAbout} />
          <NavItem href="/contact" text={t.menuContact} />
          <select
            onChange={changeLanguage}
            defaultValue={locale}
            className="w-16 text-right text-white text-shadow-sm text-lg bg-transparent tracking-wide mr-10"
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

        {/* Main Content */}
        <main className="">{children}</main>

        <ScrollToTop />
        <Footer />
      </body>
    </>
  );
}
