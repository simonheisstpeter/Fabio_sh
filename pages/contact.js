import React from "react";
import emailjs from "emailjs-com";
const email = "fabio@fabio.sh";

export default function Kontakt() {
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
    <div className="h-full w-full">
      <div className="container mx-auto pt-32">
        <div className="p-6 md:p-12 text-3xl md:text-5xl font-bold md:font-bold">
          Kontaktformular
        </div>

        <form
          className="contact-form w-full md:w-2/3 p-6 md:p-12"
          onSubmit={sendEmail}
        >
          <input type="hidden" name="contact_number" />
          <label>Name</label>
          <input
            type="text"
            name="user_name"
            className="w-full p-2 px-3 block rounded border border-emerald-300 focus:border-emerald-600 focus:bg-emerald-100 focus:text-emerald-600 mt-4 mb-6 dark:focus:ring-green-600 focus:ring-green-600 active:ring-green-400 focus:outline outline-emerald-400"
            placeholder="Name..."
          />
          <label>Email</label>
          <input
            type="email"
            name="user_email"
            className="w-full p-2 px-3 block rounded border border-emerald-300 focus:border-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 mt-4 mb-6 focus:outline outline-emerald-400"
            placeholder="Email..."
          />
          <label>Nachricht</label>
          <textarea
            name="message"
            className="w-full block rounded p-2 px-3 border border-emerald-300 focus:border-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 mt-4 mb-6 h-28 focus:outline outline-emerald-400"
            placeholder="Nachricht..."
          />

          <input
            type="submit"
            value="Los!"
            className="w-44 mt-4 py-2 bg-emerald-200 hover:bg-emerald-400 hover:text-white dark:bg-emerald-400 rounded transition duration-300 ease-in-out ring-emerald-300 dark:ring-emerald-400 text-emerald-700 dark:text-white ring-offset-4 focus:outline outline-emerald-400 hover:scale-105 dark:hover:bg-white dark:hover:text-emerald-500"
          />
        </form>

        <div className="p-6 pt-20 md:p-12 md:pt-60">
          <p>Email</p>
          <a
            href={`mailto:${email}`}
            className="text-gray-400 hover:text-emerald-400 transition duration-300"
          >
            {email}
          </a>
        </div>
      </div>
    </div>
  );
}
