import Container from "../components/Container";

export default function Home() {
  return (
    <Container>
      <div className="h-full w-full">
        <div className="container mx-auto py-32 md:py-60">
          <div className="p-6 md:p-12 text-6xl md:text-9xl font-bold md:font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-emerald-400 animate-fadeIn_2000">
              Fabio
            </span>
            <br />
            <span className="animate-fadeIn_2000">Gschweidl</span>
          </div>
        </div>
      </div>
    </Container>
  );
}
