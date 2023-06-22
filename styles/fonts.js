import localFont from "next/font/local"

const Medium = localFont({ src: './fonts/AndesNeue-Medium.woff2',variable: '--font-andesneue-medium',});
const Light = localFont({ src: './fonts/AndesNeue-Light.woff2',variable: '--font-andesneue-light',});

const andesNeue = {
  Medium, Light
}

export { andesNeue };