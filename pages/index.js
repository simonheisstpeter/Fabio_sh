import Container from "../components/Container";
import { rainbowCursor } from "cursor-effects";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    rainbowCursor();
  }, []);

  return (
    <Container>
      <div className="h-full w-full">
        <div className="container mx-auto py-32 md:py-60">
          <h1 className="p-6 md:p-12 text-6xl md:text-9xl font-bold md:font-bold">
            <p className="md:w-[315px] bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-emerald-600 animate-fadeIn_2000">
              Fabio
            </p>
            <p className="animate-fadeIn_2000">Gschweidl</p>
          </h1>
        </div>
      </div>
    </Container>
  );
}
