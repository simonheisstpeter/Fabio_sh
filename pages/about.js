import useSWR from 'swr'

export default function About() {

    const { data, error } = useSWR('/api/player', fetch)
    let text = "This Song plays now: "

    if (error) return <div>failed to load</div>
    if (!data) return <div>loading...</div>

    if (data.redirected === false ) text = "No music is playing on Spotify";

    return (
        <div className="h-full w-full">
        <div className="container mx-auto pt-32 md:pt-72">
        
        {/*
            bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400
        */}
        <span className="text-center block mb-20">
            Hier kommt bald <span className="text-md font-bold">ETWAS.... Neues</span>
        </span>
        
        <hr />
        <p className="mt-20 text-md text-center">
            Here some information about music playing on my Spotify account
        </p>
        <span className="block my-4 text-md font-bold text-center">{text}</span>
        </div>
      </div>
    )};

