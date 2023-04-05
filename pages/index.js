import { useRouter } from "next/router";
import Container from "../components/Container";
import de from "../locales/de";
import en from "../locales/en";
import es from "../locales/es";
import ja from "../locales/ja";
import pt from "../locales/pt";

export default function Home() {
  const router = useRouter()
  const { locale } = router; 
  const t = locale === "de" ? de : locale === "en" ? en : locale === "es" ? es : locale === "ja" ? ja : pt;


  return (
    <Container>
      <div className="h-full w-full">
        <div className="container mx-auto py-32 md:py-60">
          <h1 className="p-6 md:p-12 text-6xl md:text-9xl font-bold md:font-bold">
            <p className="md:w-[515px] text-gray-300 dark:text-gray-400 animate-fadeIn_2000">
              {t.name}
            </p>
            <p className="animate-fadeIn_2000">
              {t.lastname}
            </p>
          </h1>
        </div>
      </div>
    </Container>
  );
}
