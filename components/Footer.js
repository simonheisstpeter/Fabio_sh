import { useRouter } from "next/router";
import locales from "../locales";
import Link from "next/link";

const Footer = () => {
  const email = "fabio@fabio.sh";
  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"];

  return (
    <footer className="container mx-auto select-none font-andesNeueLight my-20 flex justify-between">
      <div>
        <p>{t.contactEMail}</p>
        <a
          href={`mailto:${email}`}
          className=" transition hover:text-emerald-400 text-white dark:hover:text-emerald-400 duration-200  focus:outline-2 outline-emerald-400"
        >
          {email}
        </a>
      </div>

      <Link
        href={"/mediakit"}
        className="group mx-6 md:mx-12 mt-20 w-20 block duration-300 text-darkDotsGray dark:text-white hover:text-emerald-500 dark:hover:text-emerald-500 text-sm focus:outline-2 outline-emerald-400"
      >
        Mediakit
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="inline h-4 w-4 -translate-y-[1px] duration-200 group-hover:translate-x-1 group-hover:text-emerald-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </Link>
    </footer>
  );
};

export default Footer;
