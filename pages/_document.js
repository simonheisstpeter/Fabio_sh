import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
        <title>fabio</title>
        <link rel="icon" href="/carp_streamer.ico" />
        <meta name="Title" content="Fabio Gschweidl" />
        <meta name="Author" content="Fabio Gschweidl" />
        <meta name="Publisher" content="Fabio Gschweidl" />
        <meta name="Copyright" content="Fabio Gschweidl" />
        <meta
          name="Keywords"
          content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign Wireframe Consulting Wireframe Consulting Wireframe Consulting"
        />
        <meta
          name="Description"
          content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign Wireframe Consulting Wireframe Consulting Wireframe"
        />
        x
        <meta
          name="Abstract"
          content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign Wireframe Consulting Wireframe Consulting Wireframe"
        />
        <meta name="page-topic" content="Medien" />
        <meta name="audience" content="Erwachsene" />
        <meta name="Robots" content="INDEX,FOLLOW" />
        <meta name="Language" content="de" />
        <meta
          property="og:title"
          content="Fabio Gschweidl"
        />
        <meta property="og:image" content="/meta_pic.png" />
        <meta property="og:description" content="Webdeveloper Webdevelopment Webdesign Wireframe Consulting Wireframe Consulting Wireframe" />
        <meta property="og:type" content="Website" />
        <meta property="og:site_name" content="Fabio Gschweidl" />
        <meta property="og:url" content="https://fabio.sh" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#f8f8ff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#1d1d1f"
        />
        </Head>
        <body className="dots dark:dotsDark cursor-fabiosh">
          <Main />
          <NextScript />
        </body>
        <Script src="https://cdn.jsdelivr.net/npm/party-js@latest/bundle/party.min.js" />
      </Html>
    );
  }
}

export default MyDocument;
