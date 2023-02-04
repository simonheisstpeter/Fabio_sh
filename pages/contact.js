import React from "react";
import { useRouter } from "next/router";
import emailjs from "emailjs-com";

import de from "../locales/de/contact";
import en from "../locales/en/contact";
import Container from "../components/Container";

export default function Kontakt() {
  const { locale } = useRouter();
  const t = locale === "de" ? de : en;

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
            className="w-full p-2 px-3 block rounded border border-emerald-300 focus:border-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 mt-4 mb-6 dark:focus:ring-green-600 focus:ring-green-600 active:ring-green-400 focus:outline outline-emerald-400"
            placeholder={`${t.contactName}...`}
          />
          <label>{t.contactEMail}</label>
          <input
            type="email"
            name="user_email"
            className="w-full p-2 px-3 block rounded border border-emerald-300 focus:border-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 mt-4 mb-6 focus:outline outline-emerald-400"
            placeholder={`${t.contactEMail}...`}
            required
          />
          <label>{t.contactMessage}</label>
          <textarea
            name="message"
            className="w-full block rounded p-2 px-3 border border-emerald-300 focus:border-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 mt-4 mb-6 h-28 focus:outline outline-emerald-400"
            placeholder={`${t.contactMessage}...`}
            required
          />

          <input
            type="submit"
            value={`${t.contactButton}!`}
            className="w-44 mt-4 py-2 bg-emerald-200 hover:bg-emerald-400 hover:text-white dark:bg-emerald-400 rounded transition duration-300 ease-in-out ring-emerald-300 dark:ring-emerald-400 text-emerald-700 dark:text-white ring-offset-4 focus:outline outline-emerald-400 hover:scale-105 dark:hover:bg-white dark:hover:text-emerald-500"
          />
        </form>
      </div>
    </Container>
  );
}
