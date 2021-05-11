import Image from 'next/image'

export default function Fraktur() {
    
    const email = 'fabio@fabio.sh'
    
    return (
        <div className="h-full w-full">

            <div className="container mx-auto pt-20 md:pt-60">
                <p className="mx-auto text-center">Hier kommt neues ... </p>
                <p className="mx-auto text-center mb-52">SVGs laden derzeit nicht immer aber <span className="text-md font-bold">Bald</span> ....</p>

            <div className="px-6 md:px-12 mb-12 h-full grid grid-cols-2 md:grid-cols-5 gap-12 gap-y-24">
                <Image src={'/f/0.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/1.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/2.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/3.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/4.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/5.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/6.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/7.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/8.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/9.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/10.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/11.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/12.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/13.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/14.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/15.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/16.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/17.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/18.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/19.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/20.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/21.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/22.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/23.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/24.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/25.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/26.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/27.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/28.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/29.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/30.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
                <Image src={'/f/31.svg'} width={100} height={150} className="p-4 duration-300 transform hover:scale-105"/>
            </div>
            <div className="p-6 md:p-12 md:pt-60">
                <p>Email</p>
                <a href={`mailto:${email}`} className="text-gray-400 hover:text-green-400 transition duration-300">
                    {email}
                </a>
            </div>
            </div>
        </div>
    )
}
