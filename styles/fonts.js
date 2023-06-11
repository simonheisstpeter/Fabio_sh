import localFont from "next/font/local"

// const _andesNeue = localFont({
//   src: [

//     {
//       path: '../public/fonts/AndesNeue-Bold.woff2',
//       variable: '--font-andesneue-bold',
//       weight: '700'
//     },
//     {
//       path: '../public/fonts/AndesNeue-Book.woff2',
//       variable: '--font-andesneue-book',
//       weight: '400'
//     },
//     {
//       path: '../public/fonts/AndesNeue-Medium.woff2',
//       variable: '--font-andesneue-medium',
//       weight: '500'
//     },
//     {
//       path: '../public/fonts/AndesNeue-Light.woff2',
//       variable: '--font-andesneue-light',
//       weight: '300'

//     },    
//     {
//       path: '../public/fonts/AndesNeue-ExtraLight.woff2',
//       variable: '--font-andesneue-extraLight',
//       weight: '200'
//     },
//   ],
// });

const Black = localFont({ src: '../public/fonts/AndesNeue-Black.woff2',variable: '--font-andesneue-black',});
const Bold = localFont({ src: '../public/fonts/AndesNeue-Bold.woff2',variable: '--font-andesneue-bold',});
const Medium = localFont({ src: '../public/fonts/AndesNeue-Medium.woff2',variable: '--font-andesneue-medium',});
const Book = localFont({ src: '../public/fonts/AndesNeue-Book.woff2',variable: '--font-andesneue-book',});
const Light = localFont({ src: '../public/fonts/AndesNeue-Light.woff2',variable: '--font-andesneue-light',});
const ExtraLight = localFont({ src: '../public/fonts/AndesNeue-ExtraLight.woff2',variable: '--font-andesneue-extraLight',});

const andesNeue = {
  Black, Bold, Medium, Book, Light, ExtraLight
}

export { andesNeue };