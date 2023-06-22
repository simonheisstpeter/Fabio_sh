import React from "react";
import { useRouter } from "next/router";
import emailjs from "emailjs-com";
import Container from "../components/Container";
import locales from "../locales";
import Link from "next/link";

export default function Kontakt() {
  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"]; 

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
      <div className="container mx-auto pt-32 font-andesNeueLight">
        <div className="p-6 md:p-12 text-3xl md:text-5xl font-andesNeueMedium">
          {t.contactTitle}
        </div>

        <form
          className="contact-form w-full md:w-4/5 p-6 md:p-12"
          onSubmit={sendEmail}
        >
          <input type="hidden" name="contact_number" required />
          <label className="font-andesNeueMedium">{t.contactName}</label>
          <input
            type="text"
            name="user_name"
            className="w-full p-2 px-3 block rounded border border-gray-400 focus:border-gray-400 mt-4 mb-6 focus:outline outline-[2px] outline-emerald-300 font-andesNeueLight"
            placeholder={`${t.contactName}...`}
            required
          />
          <label className="font-andesNeueMedium">{t.contactEMail}</label>
          <input
            type="email"
            name="user_email"
            className="w-full p-2 px-3 block rounded border border-gray-400 focus:border-gray-400 mt-4 mb-6 focus:outline outline-[2px] outline-emerald-300"
            placeholder={`${t.contactEMail}...`}
            required
          />
          <label className="font-andesNeueMedium">{t.contactMessage}</label>
          <textarea
            name="message"
            className="w-full p-2 px-3 block rounded border border-gray-400 focus:border-gray-400 mt-4 mb-6 focus:outline outline-[2px] outline-emerald-300 h-28"
            placeholder={`${t.contactMessage}...`}
            required
          />

          <button
            type="submit"
            className="w-44 mt-4 py-2 bg-emerald-500 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-white dark:bg-emerald-400 dark:border dark:border-emerald-500 rounded transition duration-300 ease-in-out ring-emerald-400 dark:ring-emerald-500 text-white dark:text-white focus:outline outline-emerald-400 hover:scale-105 dark:hover:bg-darkDotsGray dark:hover:text-emerald-500 dark:focus:outline outline-2 outline-offset-4 text-lg font-andesNeueMedium"
          >{t.contactButton}!</button>
        </form>

        <Link href={"/mediakit"} className="group mx-6 md:mx-12 mt-20 w-20 block duration-300 text-darkDotsGray dark:text-white hover:text-emerald-500 dark:hover:text-emerald-500 text-sm focus:outline-2 outline-emerald-400">
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
      </div>
    </Container>
  );
}
