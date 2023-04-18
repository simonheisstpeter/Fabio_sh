import useSWR from "swr";
import Image from "next/image";
import Container from "../components/Container";
import Loader from "../components/Loader";

export default function About() {
  const fetcher = (url) => fetch(url).then((r) => r.json());
  const { data, error } = useSWR("/api/player", fetcher);

  let text = "This Song plays now: ";

  if (error)
    return (
      <Container>
        <Loader />
        failed to load
      </Container>
    );
  if (!data)
    return (
      <div className="h-12 w-full py-32 text-center md:py-72">
        <Loader big />
        <p className="mt-4">...loading</p>
      </div>
    );

  if (data.isPlaying === false) text = "No music is playing on Spotify";

  return (
    <Container>
      {" "}
      <div className="container mx-auto py-32 md:py-72">
        {/*
            bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400
        */}
        <span className="mb-20 block text-center">
          Hier kommt bald{" "}
          <span className="text-md font-bold">ETWAS.... Neues</span>
        </span>
        <hr />
        <p className="text-md mt-20 text-center">
          Here some information about music playing on my Spotify account
        </p>
        <span className="text-md my-4 block text-center font-bold">{text}</span>
        {data.isPlaying && (
          <div className="mt-6 text-center">
            <span className="block text-lg font-medium">{data.title}</span>
            <span className="mt-2 block text-xl font-bold">{data.artist}</span>
            <span className="my-2 block text-lg font-medium">{data.album}</span>
            <a
              href={data.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-30 mx-auto block text-center"
            >
              <Image
                src={"/test.png"}
                placeholder="blur"
                blurDataURL={"/test.png"}
                width={200}
                height={200}
                alt={data.title}
                className={
                  data.albumImageUrl
                    ? "mx-auto rounded-md"
                    : "mx-auto rounded-md border border-dotted dark:mix-blend-difference"
                }
              />
            </a>
            <a
              href={data.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block font-light"
            >
              Click here to get to the song
            </a>
          </div>
        )}
      </div>
    </Container>
  );
}

// https://developer.apple.com/documentation/applemusicapi

// For APPLE Music
