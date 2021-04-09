import Image from 'next/image'

export default function Fraktur({ array }) {
     
    
    return (
        <div className="h-full w-full">

            <div className="container mx-auto pt-20 md:pt-60">
            <p className="mx-auto text-center mb-60">Hier kommt neues ... <span className="text-md font-bold">Bald</span> ....</p>

            <div className="px-6 md:px-12 mb-12 h-full grid grid-cols-2 md:grid-cols-5 gap-12 gap-y-24">
                {array.map((data, index) => <Image src={'/f/'+ index + '.svg'} width={100} height={150} alt={data} className="p-4 duration-300 transform hover:scale-105"/>)}
            </div>
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

 export async function getServerSideProps() {
        const array = [...Array(30)]  
      return {
        props: { array: array }, // will be passed to the page component as props
      }
}
