import { useRouter } from "next/router";
import Link from "next/link";

import en from "../locales/en/404";
import de from "../locales/de/404";
import Container from "../components/Container";

export default function Custom404() {
  const router = useRouter();
  const { locale } = router;
  const t = locale === "en" ? en : de;

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
