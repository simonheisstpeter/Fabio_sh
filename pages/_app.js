import "../styles/globals.css";
import Head from "next/head";
import { ThemeProvider } from "next-themes";

export default function MyApp({ Component, pageProps }) {
  // document.title = "Love is in the air";

  // useEffect(() => {
  //   for (let i = 1; i <= arrayLength; i++) {
  //     setTimeout(function () {
  //       console.log(i);
  //       document.title = "fabio " + LIST_OF_EMOJIS[i - 1];
  //     }, 1000 * i);
  //     if (i + 1 > arrayLength) i = 1;
  //   }
  // }, []);

  return (
    <>
      <ThemeProvider attribute="class">
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
