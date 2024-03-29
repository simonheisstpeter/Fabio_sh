import { useRouter } from "next/router";
import Link from "next/link";
import Container from "../components/Container";
import locales from "../locales";

export default function Custom404() {
  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"];

  return (
    <Container>
      <section className="h-screen w-full">
        <h1 className="w-full pt-32 text-center text-9xl text-emerald-500 md:pt-56 font-andesNeueMedium">
          404
        </h1>
        <h2 className="mt-12 w-full text-center text-2xl text-white">
          {t.custom404Title}
        </h2>
        <Link
          href="/"
          className="mx-auto mt-12 block w-32 rounded-lg border-2 border-emerald-500 px-4 py-2 text-center duration-300 hover:bg-emerald-500 hover:text-white text-white focus:outline-2 outline-darkDotsGray darkoutline-white"
        >
          {t.custom404Button}
        </Link>
      </section>
    </Container>
  );
}
