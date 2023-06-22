import { useRouter } from "next/router";
import Container from "../components/Container";
import locales from "../locales";

export default function Home() {
  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"]; 
  
  return (
    <Container>
      <div className="h-full w-full">
        <div className="container mx-auto py-32 md:py-60">
          <h1
            className={`${
              locale === "ja" ? "space-y-4 text-5xl md:space-y-6" : "text-6xl"
            } px-6 font-andesNeueMedium md:px-12 md:text-9xl md:font-andesNeueMedium`}
          >
            <span className="block animate-fadeIn_2000 text-gray-300 dark:text-gray-400 md:w-[515px]  drop-shadow-sm">
              {t.name}
            </span>
            <span className="block animate-fadeIn_2000 delay-500 drop-shadow-xl">{t.lastname}</span>  
            <span className="block animate-fadeIn_2000 delay-1000 text-xl md:text-3xl text-emerald-500 mt-4 font-andesNeueMedium transition hover:underline decoration-dashed duration-300 underline-offset-8 drop-shadow-sm">\ digital media & IT</span>
          </h1>
      </div>
      </div>
    </Container>
  );
}
