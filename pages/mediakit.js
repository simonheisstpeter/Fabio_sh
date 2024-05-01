import React from "react";
import { useRouter } from "next/router";
import Container from "../components/Container";
import locales from "../locales";
import localFont from "next/font/local";
import Loader from "../components/Loader";
import Image from "next/image";

// const Black = localFont({ src: '../public/font',variable: '--font-andesneue-black',});
// const Bold = localFont({ src: 'fonts/AndesNeue-Bold.woff2',variable: '--font-andesneue-bold',});
// const Medium = localFont({ src: 'fonts/AndesNeue-Medium.woff2',variable: '--font-andesneue-medium',});
// const Book = localFont({ src: 'fonts/AndesNeue-Book.woff2',variable: '--font-andesneue-book',});
// const Light = localFont({ src: 'fonts/AndesNeue-Light.woff2',variable: '--font-andesneue-light',});
// const ExtraLight = localFont({ src: 'fonts/AndesNeue-ExtraLight.woff2',variable: '--font-andesneue-extraLight',});

export default function Kontakt() {
  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"];

  // const andesNeue = {
  //   Black, Bold, Medium, Book, Light, ExtraLight
  // }

  return (
    <Container>
      {" "}
      <div className="container mx-auto pt-32 font-andesNeueLight px-6 md:px-12">
        <div className="text-3xl md:text-5xl font-andesNeueMedium mb-12 text-white">
          MediaKit
        </div>

        {/* Fonts */}
        <section aria-labelledby="Fonts">
          <span className="border-b-2 border-emerald-400 pb-1 text-white hover:text-emerald-400 duration-200">
            Fonts
          </span>
          <div aria-aria-label="Fonts" className="mt-12 mb-20 md:w-2/3 text-white">
            <h3 className="font-andesNeueMedium text-3xl mb-4">
              Andes Neue Medium
            </h3>
            <p className="font-andesNeueLight text-3xl">Andes Neue Light</p>
          </div>
        </section>

        {/* Colours */}
        <section aria-labelledby="Colours">
          <span className="border-b-2 border-emerald-400 pb-1 text-white hover:text-emerald-400 duration-200">
            Colours
          </span>
          <div
            aria-aria-label="Colours"
            className="mt-12 mb-20 md:w-2/3 border-white rounded-md grid grid-cols-2 md:grid-cols-4 gap-8 align-middle justify-center text-white"
          >
            <div className="text-center">
              <div className="block h-20 w-20 mx-auto bg-white border border-white rounded-full mb-4"></div>
              <span className="block">White</span>
              <span className="block text-emerald-500">#fff</span>
            </div>
            <div className="text-center">
              <div className="block h-20 w-20 mx-auto bg-darkDotsGray border border-white rounded-full mb-4"></div>
              <span className="block">Dark Gray</span>
              <span className="block text-emerald-500">#030303</span>
            </div>
            <div className="text-center">
              <div className="block h-20 w-20 mx-auto bg-emerald-400 rounded-full mb-4"></div>
              <span className="block">Emerald 400</span>
              <span className="block text-emerald-500">#34d399</span>
            </div>
            <div className="text-center">
              <div className="block h-20 w-20 mx-auto bg-emerald-500 rounded-full mb-4"></div>
              <span className="block">Emerald 500</span>
              <span className="block text-emerald-500">#10b981</span>
            </div>
          </div>
        </section>

        {/* Cursor */}
        <section aria-labelledby="Cursor">
          <span className="border-b-2 border-emerald-400 pb-1 text-white hover:text-emerald-400 duration-200">
            Cursor
          </span>
          <div
            aria-aria-label="Cursor"
            className="mt-12 mb-20 md:w-2/3 border-white rounded-md grid grid-cols-2 md:grid-cols-4 gap-8 align-middle justify-center"
          >
            <Image
              src={"/f.png"}
              height={30}
              width={30}
              alt="Cursor fabio.sh"
            />
          </div>
        </section>

        {/* Loader */}
        <section aria-labelledby="Loader">
          <span className="border-b-2 border-emerald-400 pb-1 text-white hover:text-emerald-400 duration-200">
            Loading Icon / Logo
          </span>
          <div
            aria-aria-label="Loader"
            className="mt-12 mb-20 md:w-2/3 border-white rounded-md flex align-middle justify-center"
          >
            <Loader big />
          </div>
        </section>
      </div>
    </Container>
  );
}
