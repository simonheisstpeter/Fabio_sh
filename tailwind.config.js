module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeIn_2000: "fade 2s",
        fadeIn_2200: "fade 2.2s",
        fadeIn_2500: "fade 2.5s",

        fadeIn_3000: "fade 3s",
        bgFade: "bgFade 4s",
        loaderBig: "loaderBig 1.5s ease-in-out infinite",
        loaderRetourBig: "loaderRetourBig 2s ease-in-out infinite",
        loaderSmall: "loaderSmall 4s ease-in-out infinite",
        loaderRetourSmall: "loaderRetourSmall 4s ease-in-out infinite",
      },
      colors: {
        darkDotsGray: "#030303",
        loaderAlpha: "rgb(56, 109, 241)/ 0.05",
        loaderBorder: "rgb(255, 255, 255)/ 0.1",
      },
      cursor: {
        fabiosh: "url(/f.cur), pointer",
      },
      fontFamily: {
        // 'andesNeueBlack': ['var(--font-andesneue-black)'],
        // 'andesNeueBold': ['var(--font-andesneue-bold)'],
        // 'andesNeueBook': ['var(--font-andesneue-book)'],
        andesNeueMedium: ["var(--font-andesneue-medium)"],
        andesNeueLight: ["var(--font-andesneue-light)"],
        // 'andesNeueExtraLight': ['var(--font-andesneue-extraLight)'],
      },
      keyframes: {
        loaderSmall: {
          "0%": { transform: "translateX(-10px)" },
          "50%": { transform: "translateX(10px)" },
          "100%": { transform: "translateX(-10px)" },
        },
        loaderRetourSmall: {
          "0%": { transform: "translateX(10px)" },
          "50%": { transform: "translateX(-10px)" },
          "100%": { transform: "translateX(10px)" },
        },
        loaderBig: {
          "0%": { transform: "translateX(-80px)" },
          "50%": { transform: "translateX(80px)" },
          "100%": { transform: "translateX(-80px)" },
        },
        loaderRetourBig: {
          "0%": { transform: "translateX(80px)" },
          "50%": { transform: "translateX(-80px)" },
          "100%": { transform: "translateX(80px)" },
        },
        fade: {
          "0%": { transform: "translate(-20px, 0px)", opacity: 0 },
          "100%": { transform: "translate(0px, 0px)", opacity: 1 },
        },
        bgFade: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
