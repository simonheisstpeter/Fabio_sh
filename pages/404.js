import { useRouter } from "next/router";
import Link from "next/link";
import Container from "../components/Container";

import en from "../locales/en";
import de from "../locales/de";
import es from "../locales/es";
import pt from "../locales/pt";
import ja from "../locales/ja";

export default function Custom404() {
  const router = useRouter();
  const { locale } = router;
  const t = locale === "de" ? de : locale === "en" ? en : locale === "es" ? es : locale === "ja" ? ja : pt;

  return (
    <Container>
    <section className="h-screen w-full">
      <h1 className="pt-32 md:pt-56 text-emerald-500 w-full text-center text-9xl">
        404
      </h1>
      <h2 className="mt-12 text-emerald-500 dark:text-white w-full text-center text-2xl font-semibold">
        {t.custom404Title}
      </h2>
      <Link
        href="/"
        className="block text-center w-32 mt-12 bg-gradient-to-br hover:from-emerald-300 hover:to-emerald-500 border-emerald-500 border-2 px-4 py-2 rounded-lg mx-auto text-emerald-500 hover:text-white dark:text-white duration-300"
      >
        {t.custom404Button}
      </Link>
    </section>
    </Container>
  );
}
