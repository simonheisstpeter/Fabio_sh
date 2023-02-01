import { useRouter } from "next/router";
import Link from "next/link";

import en from "../locales/en/404";
import de from "../locales/de/404";

export default function Custom404() {
  const router = useRouter();
  const { locale } = router;
  const t = locale === "en" ? en : de;

  return (
    <section className="h-screen w-full">
      <h1 className="pt-32 md:pt-56 text-emerald-500 w-full text-center text-9xl">
        404
      </h1>
      <h2 className="mt-12 text-white w-full text-center text-2xl font-semibold">
        {t.custom404Title}
      </h2>
      <Link
        href="/"
        className="block text-center w-32 mt-12 bg-gradient-to-br hover:from-emerald-300 hover:to-emerald-500 border-emerald-600 border-2 px-4 py-2 rounded-lg duration-300 mx-auto text-white"
      >
        {t.custom404Button}
      </Link>
    </section>
  );
}
