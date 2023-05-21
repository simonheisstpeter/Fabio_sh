import { useRouter } from "next/router";
import locales from "../locales";


const Footer = () => {
  const email = "fabio@fabio.sh";
  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"]; 

  return (
      <footer className="container mx-auto select-none p-6 md:p-12">
        <p>{t.contactEMail}</p>
        <a
          href={`mailto:${email}`}
          className="text-gray-700 transition duration-300 hover:text-emerald-400 dark:text-white"
        >
          {email}
        </a>
      </footer>
  );
};

export default Footer;
