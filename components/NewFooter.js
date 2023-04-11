import { useRouter } from "next/router";
import de from "../locales/de";
import en from "../locales/en";
import es from "../locales/es";
import pt from "../locales/pt";
import ja from "../locales/ja";

const Footer = () => {
  const email = "fabio@fabio.sh";
  const router = useRouter();
  const { locale } = router;
  const t = locale === "de" ? de : locale === "en" ? en : locale === "es" ? es : locale === "ja" ? ja : pt;

  return (
    <>
      <footer className="container mx-auto p-6 md:p-12 select-none">
        <p>{t.contactEMail}</p>
        <a
          href={`mailto:${email}`}
          className="text-gray-700 dark:text-white hover:text-emerald-400 transition duration-300"
        >
          {email}
        </a>
      </footer>
    </>
  );
};

export default Footer;
