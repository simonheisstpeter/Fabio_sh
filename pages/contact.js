import React from "react";
import { useRouter } from "next/router";
import emailjs from "emailjs-com";
import Container from "../components/Container";

import de from "../locales/de";
import en from "../locales/en";
import es from "../locales/es";
import pt from "../locales/pt";
import ja from "../locales/ja";

export default function Kontakt() {
  const { locale } = useRouter();
  const t = locale === "de" ? de : locale === "en" ? en : locale === "es" ? es : locale === "ja" ? ja : pt;

  function sendEmail(e) {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_3bgrnby",
        "template_324bi3e",
        e.target,
        "user_P3FaRZzFox8WueiQrcAYX"
      )
      .then(
        (result) => {
          // console.log(result.text);
        },
        (error) => {
          // console.log(error.text);
        }
      );
    e.target.reset();
  }

  return (
    <Container>
      {" "}
      <div className="container mx-auto pt-32">
        <div className="p-6 md:p-12 text-3xl md:text-5xl font-bold md:font-bold">
          {t.contactTitle}
        </div>

        <form
          className="contact-form w-full md:w-4/5 p-6 md:p-12"
          onSubmit={sendEmail}
        >
          <input type="hidden" name="contact_number" required />
          <label>{t.contactName}</label>
          <input
            type="text"
            name="user_name"
            className="w-full p-2 px-3 block rounded border border-gray-400 focus:border-gray-400 mt-4 mb-6 focus:outline outline-[2px] outline-emerald-300"
            placeholder={`${t.contactName}...`}
          />
          <label>{t.contactEMail}</label>
          <input
            type="email"
            name="user_email"
            className="w-full p-2 px-3 block rounded border border-gray-400 focus:border-gray-400 mt-4 mb-6 focus:outline outline-[2px] outline-emerald-300"
            placeholder={`${t.contactEMail}...`}
            required
          />
          <label>{t.contactMessage}</label>
          <textarea
            name="message"
            className="w-full p-2 px-3 block rounded border border-gray-400 focus:border-gray-400 mt-4 mb-6 focus:outline outline-[2px] outline-emerald-300 h-28"
            placeholder={`${t.contactMessage}...`}
            required
          />

          <input
            type="submit"
            value={`${t.contactButton}!`}
            className="w-44 mt-4 py-2 bg-gray-200 hover:bg-emerald-300 hover:text-white dark:bg-gray-900 dark:border dark:border-emerald-300 rounded transition duration-300 ease-in-out ring-emerald-300 dark:ring-emerald-500 text-gray-900 dark:text-white focus:outline outline-emerald-400 hover:scale-105 dark:hover:bg-emerald-300 dark:hover:text-gray-800 dark:focus:outline outline-2 outline-offset-4"
          />
        </form>
      </div>
    </Container>
  );
}
