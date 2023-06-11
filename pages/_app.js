import { useEffect } from "react";
import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
// import localFont from 'next/font/local'

// const andesNeue = localFont({
//   src: [
//     {
//       path: './AndesNeue-Bold.woff2',
//       variable: '--font-andesneue-bold',
//     },
//     {
//       path: './AndesNeue-Book.woff2',
//       variable: '--font-andesneue-book',
//     },
//     {
//       path: './AndesNeue-Medium.woff2',
//       variable: '--font-andesneue-medium',
//     },
//     {
//       path: './AndesNeue-Light.woff2',
//       variable: '--font-andesneue-light',
//     },
//   ],
// });

export default function MyApp({ Component, pageProps }) {

  // useEffect(() => {
  //   for (let i = 1; i <= arrayLength; i++) {
  //     setTimeout(function () {
  //       console.log(i);
  //       document.title = "fabio " + LIST_OF_EMOJIS[i - 1];
  //     }, 1000 * i);
  //     if (i + 1 > arrayLength) i = 1;
  //   }
  // }, []);

  // Title Animation
  useEffect(() => {

      window.addEventListener('blur', () => {
        document.title = "😢 Come back! 😢"
      })
      window.addEventListener('focus', () => {
        document.title = "Fabio.sh"
      })
 
  }, []);

  return (
    <>
      <ThemeProvider attribute="class">
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
