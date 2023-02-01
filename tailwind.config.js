module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}', 
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      cursor: {
        'fabiosh': 'url(/f.cur), pointer',
      },
      animation: {
        fadeIn_2000: "fade 2s",
        fadeIn_3000: "fade 3s",
        bgFade: "bgFade 4s"
      },
      keyframes: {
        fade: {
          "0%": {
            transform: "translate(-20px, 0px)",
            opacity: 0,
          },
          "100%": {
            transform: "translate(0px, 0px)",
            opacity: 1,
          },
          bgFade: {
            "0%": {
              opacity: 0,
            },
            "100%": {
              opacity: 1,
            },
          }

        }
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
