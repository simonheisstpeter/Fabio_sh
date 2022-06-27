import useSWR from "swr";
import Image from "next/image";

export default function About() {
  const fetcher = (url) => fetch(url).then((r) => r.json());
  const { data, error } = useSWR("/api/player", fetcher);

  let text = "This Song plays now: ";

  if (error) return <div>failed to load</div>;
  if (!data)
    return <div className="w-full py-32 md:py-72 text-center">loading...</div>;

  if (data.isPlaying === false) text = "No music is playing on Spotify";

  return (
    <div className="h-full w-full">
      <div className="container mx-auto py-32 md:py-72">
        {/*
            bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400
        */}
        <span className="text-center block mb-20">
          Hier kommt bald{" "}
          <span className="text-md font-bold">ETWAS.... Neues</span>
        </span>
        <hr />
        <p className="mt-20 text-md text-center">
          Here some information about music playing on my Spotify account
        </p>
        <span className="block my-4 text-md font-bold text-center">{text}</span>
        {data.isPlaying && (
          <div className="text-center mt-6">
            <span className="text-lg font-medium block">{data.title}</span>
            <span className="text-xl font-bold block mt-2">{data.artist}</span>
            <span className="text-lg font-medium block mt-2">{data.album}</span>
            <Image src={data.albumImageUrl} width={50} height={50} />
            <a href={data.songUrl} className="block mt-8 font-light">Click here to get to the song</a>
          </div>
        )}
      </div>
    </div>
  );
}

// https://developer.apple.com/documentation/applemusicapi

// For APPLE Music
