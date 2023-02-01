import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
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
