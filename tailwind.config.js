module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}', 
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      animation: {
        fadeIn_2000: "fade 2s",
        fadeIn_3000: "fade 3s",
        bgFade: "bgFade 4s",
        loaderBig: "loaderBig 1.5s ease-in-out infinite",
        loaderRetourBig: "loaderRetourBig 2s ease-in-out infinite",
        loaderSmall: "loaderSmall 4s ease-in-out infinite",
        loaderRetourSmall: "loaderRetourSmall 4s ease-in-out infinite"
      },
      colors: {
        darkDotsGray: "#1d1d1f",
        loaderAlpha: 'rgb(56, 109, 241)/ 0.05',
        loaderBorder: 'rgb(255, 255, 255)/ 0.1'
      },
      cursor: {
        'fabiosh': 'url(/f.cur), pointer',
      },
      fontFamily: {
        'andesNeueBlack': ['AndesNeueBlack', 'system-ui', 'sans-serif'],
        'andesNeueBold': ['AndesNeueBold', 'system-ui', 'sans-serif'],
        'andesNeueBook': ['AndesNeueBook', 'system-ui', 'sans-serif'],
        'andesNeueMedium': ['AndesNeueMedium', 'system-ui', 'sans-serif'],
        'andesNeueLight': ['AndesNeueLight', 'system-ui', 'sans-serif'],
        'andesNeueExtraLight': ['AndesNeueExtraLight', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        loaderSmall: {
          "0%": { transform: "translateX(-10px)" },
          "50%": { transform: "translateX(10px)" },
          "100%": { transform: "translateX(-10px)" }
        },
        loaderRetourSmall: {
          "0%": { transform: "translateX(10px)" },
          "50%": { transform: "translateX(-10px)" },
          "100%": { transform: "translateX(10px)" }
        }, 
        loaderBig: {
          "0%": { transform: "translateX(-80px)" },
          "50%": { transform: "translateX(80px)" },
          "100%": { transform: "translateX(-80px)" }
        },
        loaderRetourBig: {
          "0%": { transform: "translateX(80px)" },
          "50%": { transform: "translateX(-80px)" },
          "100%": { transform: "translateX(80px)" }
        },
        fade: {
          "0%": { transform: "translate(-20px, 0px)", opacity: 0 },
          "100%": { transform: "translate(0px, 0px)", opacity: 1 },
        },
        bgFade: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        }
      },
      
    },
  },
  darkMode: 'class',
  plugins: [],
};
