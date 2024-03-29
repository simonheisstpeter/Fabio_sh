import { useEffect } from "react";
import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import { andesNeue } from "../styles/fonts";
import { ConsoleMessage } from "../lib/concoleMessage";

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
    ConsoleMessage();
    
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
        <div className={`${andesNeue.Light.variable} ${andesNeue.Medium.variable} selection:text-white selection:bg-emerald-500`}>
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </>
  );
}
