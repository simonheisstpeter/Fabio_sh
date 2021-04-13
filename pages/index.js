import Head from 'next/head'
import Image from 'next/image'

const links = {

}

export default function Home({ links }) {
  return (
    <div className="h-full w-full">
     
      <div className="container mx-auto pt-32 md:pt-60">
        <div className="px-6 md:px-12 text-6xl md:text-9xl font-bold md:font-bold">
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
          <a href="mailto:f.gschweidl@gmail.com" className="text-gray-400 hover:text-green-400 transition duration-300">
            f.gschweidl@gmail.com
          </a>
        </div>

      </div>
    </div>
  )
}
