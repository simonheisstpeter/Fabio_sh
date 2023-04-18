import { useRouter } from "next/router";
import Container from "../components/Container";
import de from "../locales/de";
import en from "../locales/en";
import es from "../locales/es";
import ja from "../locales/ja";
import pt from "../locales/pt";

export default function Home() {
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

  return (
    <Container>
      <div className="h-full w-full">
        <div className="container mx-auto py-32 md:py-60">
          <h1
            className={`${
              locale === "ja" ? "space-y-4 text-5xl md:space-y-6" : "text-6xl"
            } p-6 font-bold md:p-12 md:text-9xl md:font-bold`}
          >
            <p className="animate-fadeIn_2000 text-gray-300 dark:text-gray-400 md:w-[515px]">
              {t.name}
            </p>
            <p className="animate-fadeIn_2000">{t.lastname}</p>
          </h1>
        </div>
      </div>
    </Container>
  );
}
