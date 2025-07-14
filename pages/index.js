import { useRouter } from "next/router";
import Container from "../components/Container";
import Card from "../components/Card";
import locales from "../locales";
import React from "react";
import emailjs from "emailjs-com";
import { ProjectData } from "../utils/projectsData";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"];
  const CardData = [
    {
      title: "Project 1",
      text: "",
      graphic: "",
      link: "",
    },
    {
      title: "Project 2",
      text: "",
      graphic: "",
      link: "",
    },
    {
      title: "Project 3",
      text: "",
      graphic: "",
      link: "",
    },
  ];
  function sendEmail(e) {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_3bgrnby",
        "template_324bi3e",
        e.target,
        "user_P3FaRZzFox8WueiQrcAYX",
      )
      .then(
        (result) => {
          // console.log(result.text);
        },
        (error) => {
          // console.log(error.text);
        },
      );
    e.target.reset();
  }

  // const currentProjects = ProjectData.filter(
  //   (pr) => !pr.finished && pr.published,
  // );

  return (
    <Container>
      <div className="h-full w-full grid gap-56">
        <div className="container mx-auto pt-32 md:pt-60">
          <h1
            className={`${
              locale === "ja" ? "space-y-4 text-5xl md:space-y-6" : "text-6xl"
            } w-fit px-6 font-andesNeueMedium md:pl-12 md:text-9xl md:font-andesNeueMedium block animate-fadeIn_2000 text-transparent bg-gradient-to-tr transition-all duration-300 from-white to-transparent bg-clip-text`}
          >
            <span className="">{t.name}</span>
            <span className="block">{t.lastname}</span>
            <span className="block animate-fadeIn_2000 delay-1000 text-xl md:text-3xl text-emerald-500 mt-4 font-andesNeueMedium transition duration-300 underline-offset-8 drop-shadow-sm">
              \\ digital media & IT
            </span>
          </h1>
        </div>

        {/* Projekt Sektion */}
        <section className="container relative mx-auto grid lg:grid-cols-3 lg:grid-rows-2 gap-4 min-h-[600px] ">
          {CardData.map((item, index) => (
            <React.Fragment key={index}>
              <Card {...item} itemKey={index} />
            </React.Fragment>
          ))}
          <div className="absolute w-full bg-neutral-800/20 hover:bg-black/50 duration-300 h-full text-center rounded-3xl text-4xl font-andesNeueMedium flex justify-center items-center text-white">
            <p>{t.comingSoon}</p>
            <Link href="/projects" className="hover:underline focus:underline flex gap-3 items-center hover:gap-5 transform-gpu transitiion-all duration-200">{t.toProjectsLink} <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 ">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
            </Link>
          </div>
        </section>

        {/* Projekt Sektion */}
        <section className="container mx-auto">
          <div className="flex flex-col gap-12">
            <div className="text-3xl md:text-5xl font-andesNeueMedium">
              {t.contactTitle}
            </div>

            <form
              className="contact-form w-full md:w-4/5 mx-auto max-w-xl my-12 text-white"
              onSubmit={sendEmail}
            >
              <input type="hidden" name="contact_number" required />
              <div className="mt-4 mb-6 group flex flex-col gap-2">
                <label className="font-andesNeueMedium">{t.contactName}</label>

                <div className="bg-gradient-to-t from-white/20 ring-1 ring-white/10 rounded p-1">
                  <input
                    type="text"
                    name="user_name"
                    className="bg-[#030303] w-full p-2 px-3 block rounded border border-white/10 focus:border-gray-400 group-focus:outline outline-[2px] outline-white"
                    placeholder={`${t.contactName}...`}
                    required
                  />
                </div>
              </div>
              {/*  */}
              <div className="mt-4 mb-6 group flex flex-col gap-2">
                <label className="font-andesNeueMedium">{t.contactEMail}</label>
                <div className="bg-gradient-to-t from-white/20 ring-1 ring-white/10 rounded p-1">
                  <input
                    type="email"
                    name="user_email"
                    className="bg-[#030303] w-full p-2 px-3 block rounded borderborder-white/10 focus:border-gray-400  group-focus:outline outline-[2px] outline-white"
                    placeholder={`${t.contactEMail}...`}
                    required
                  />
                </div>
              </div>
              {/*  */}
              <div className="mt-4 mb-6 group flex flex-col gap-2">
                <label className="font-andesNeueMedium">
                  {t.contactMessage}
                </label>
                <div className="bg-gradient-to-t from-white/20 ring-1 ring-white/10 rounded p-1">
                  <textarea
                    name="message"
                    className="bg-[#030303] w-full p-2 px-3 block rounded border border-white/10 focus:border-gray-400 group-focus:outline outline-[2px] outline-white h-28"
                    placeholder={`${t.contactMessage}...`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-44 mt-4 py-2 bg-emerald-600 border border-emerald-700 rounded transition duration-300 ease-in-out ring-emerald-500 text-white outline-emerald-400 hover:bg-darkDotsGray hover:text-emerald-500 focus:outline outline-2 outline-offset-4 text-lg font-andesNeueMedium"
              >
                {t.contactButton}!
              </button>
            </form>
          </div>
        </section>
      </div>
    </Container>
  );
}
