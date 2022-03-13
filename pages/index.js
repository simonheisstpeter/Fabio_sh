export default function Home() {
  const email = "fabio@fabio.sh";

  return (
    <div className="h-full w-full">
      <div className="container mx-auto pt-32 md:pt-60">
        <div className="p-6 md:p-12 text-6xl md:text-9xl font-bold md:font-bold">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-emerald-400">
            Fabio
          </span>
          <br />
          <span className="">Gschweidl</span>
        </div>

        <div className="p-6 pt-20 md:p-12 md:pt-60">
          <p>Email</p>
          <a
            href={`mailto:${email}`}
            className="text-gray-400 hover:text-emerald-400 transition duration-300"
          >
            {email}
          </a>
        </div>
      </div>
    </div>
  );
}
