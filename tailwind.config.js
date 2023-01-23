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
        moveIn: "move 2s"
      },
      keyframes: {
        fade: {
          "0%": {
            transform: "translate(0px, 50px)",
            opacity: 0,
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
            opacity: 1,
          },
        }
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
