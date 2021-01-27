import Head from 'next/head'

const links = {

}

export default function Home({ links }) {
  return (
    <div className="h-screen w-screen">
      <Head>
        <title>fabio</title>
        <link rel="icon" href="/carp_streamer.ico" />

        <meta name="Title" content="Fabio Gschweidl"/>
        <meta name="Author" content="Fabio Gschweidl"/>
        <meta name="Publisher" content="Fabio Gschweidl"/>
        <meta name="Copyright" content="Fabio Gschweidl"/>
        <meta name="Revisit" content="After 5 days"/>
        <meta name="Keywords" content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign"/>
        <meta name="Description" content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign"/>
        <meta name="Abstract" content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign"/>
        <meta name="page-topic" content="Medien"/>
        <meta name="page-topic" content="Private Homepage"/>
        <meta name="audience" content="Erwachsene"/>
        <meta name="Robots" content="INDEX,FOLLOW"/>
        <meta name="Language" content="en"/>

        <meta property="og:title" content="Fabio Gschweidl Webdeveloper Webdevelopment Webdesign" />
        <meta property="og:image" content="/meta_pic.png" />
        <meta property="og:description" content="Coming soon ..." />
        <meta property="og:type" content="Website" />
        <meta property="og:site_name" content="Fabio Gschweidl" />
        <meta property="og:url" content="https://fabio.sh" />
      </Head>
      <div className="container mx-auto pt-32 md:pt-72">
        <div class="px-6 md:px-12 text-6xl md:text-9xl font-bold md:font-bold">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-200 to-green-400">
            Fabio 
          </span>
          <br />
          <span className="">
           Gschweidl
          </span>
        </div>

        {/* Links 
        <div className="p-12 pt-32">
          <p>Links</p>
          <div className="grid grid-cols-4 ">

          </div>
        </div>
        */}
        <div className="p-6 md:p-12 md:pt-60">
          <p>Email</p>
          <a href="mailto:fabio@fabio.sh" className="text-gray-400 hover:text-green-400 transition duration-300">
            fabio(at)fabio.sh
          </a>
        </div>

      </div>
    </div>
  )
}
