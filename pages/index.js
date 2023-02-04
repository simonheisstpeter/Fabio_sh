import Container from "../components/Container";

export default function Home() {

  return (
    <Container>
      <div className="h-full w-full">
        <div className="container mx-auto py-32 md:py-60">
          <h1 className="p-6 md:p-12 text-6xl md:text-9xl font-bold md:font-bold">
            <p className="md:w-[315px] text-emerald-500 animate-fadeIn_2000">
              Fabio
            </p>
            <p className="animate-fadeIn_2000">Gschweidl</p>
          </h1>
        </div>
      </div>
    </Container>
  );
}
