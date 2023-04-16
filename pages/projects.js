import Confetti from "../components/Confetti";
import Container from "../components/Container";
import { useRouter } from "next/router";
import de from "../locales/de";
import en from "../locales/en";
import es from "../locales/es";
import ja from "../locales/ja";
import pt from "../locales/pt";
import { ProjectData } from "../utils/projectsData";
import Image from "next/image";

const Project = ({ locale, t, ...item }) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.title}
      href={item.url}
      className="bg-white dark:bg-[#1d1d1f] hover:border-emerald-400 rounded-md border border-gray-400 hover:-translate-y-1 duration-200 shadow-sm hover:shadow cursor-fabiosh"
    >
      {item.finished === false ? (
        <picture className="block inset-0 max-h-[250px]">
          <Image
            src={item.image || "/meta_pic.pn"}
            width={400}
            height={200}
            alt={item.title}
            placeholder="blur"
            blurDataURL={item.image || "/meta_pic.png"}
            className="grayscale hover:grayscale-0 duration-200 rounded-t-md max-h-[220px] object-cover"
          />
        </picture>
      ) : null}
      <div className="bg-white dark:bg-[#1d1d1f] p-4 text-sm rounded-b-md">
        <h3 key={item.title} className="font-medium mb-4 text-base relative">
          {item.title}
          <span
            className={`${
              item.online
                ? "bg-emerald-400"
                : item.finished === false
                ? "bg-yellow-300"
                : "bg-red-500"
            } inline-block w-2.5 h-2.5 rounded-full group ml-2`}
          >
            {" "}
            <span class="absolute invisible group-hover:visible bottom-5 rounded-md bg-black text-white p-1 px-2 duration-200 z-50 -translate-x-7">
              {item.online ? "Online" : "Offline"}
            </span>
          </span>
        </h3>

        <p className="text-gray-700 dark:text-gray-100 mb-2">
          {item.description[locale].text !== ""
            ? item.description[locale].text
            : item.description["en"].text}
        </p>
        <span className="text-gray-400 mb-2 block">
          {item.languages.map((language) => (
            <span className="mr-1 grayscale hover:grayscale-0 relative group">
              {language.flag}
              <span class="absolute invisible group-hover:visible bottom-5 rounded-md bg-black text-white p-1 px-2 duration-200 z-50 -translate-x-11">
                {language.lang}
              </span>
            </span>
          ))}
        </span>

        <a
          className={`block group text-emerald-400 hover:text-emerald-500 duration-300`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.title}
          href={item.url}
        >
          {t.website}{" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4 inline opacity-0 group-hover:opacity-100 -translate-y-[1px] group-hover:translate-x-1 duration-200"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </a>
        <div className="overflow-y-auto mt-4">
          {item.categories.map((category) => (
            <span className="p-1 px-2 border-[0.5px] dark:text-gray-400 dark:border-gray-400 inline-block text-[0.8em] rounded-xl mb-1 mr-1">
              {category}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
};

const ExtraBox = ({ text }) => {
  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-md border border-gray-300 hover:-translate-y-1 duration-200 shadow-sm hover:shadow flex items-center place-content-center">
      <div className="">
        {text}
      </div>
    </div>
  );
};

export default function ProjectsView() {
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
    <>
      <Container>
        <div className="h-full container mx-auto px-4 md:px-12">
          <h1 className="text-xl my-20">{t.menuProjects}</h1>

          <h2 className="mb-6">Current projects</h2>
          <article className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
            {ProjectData.filter((pr) => pr.finished === false).map((item) => (
              <Project {...item} locale={locale} t={t} />
            ))}
          </article>

          <h2 className="mb-6">Finished projects</h2>
          <article className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6 opacity-50 hover:opacity-100 duration-200">
            {ProjectData.filter((pr) => pr.finished === true).map((item) => (
              <Project {...item} locale={locale} t={t} />
            ))}
            {/* Extra Box */}
            <ExtraBox text={t.comingSoon} />
          </article>
        </div>
        <Confetti />
      </Container>
    </>
  );
}
