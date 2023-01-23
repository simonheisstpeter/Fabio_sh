import Script from "next/script";
import { useEffect } from "react";
import Container from "../components/Container";

export default function Project() {
  useEffect(() => {
    let el = document.getElementById("partyEffect");
    if (el) {
      el.addEventListener("click", function (e) {
        party.confetti(this);
      });
    }
  });

  return (
    <>
      <Container>
        <div className="h-full w-full">
          <div
            id="partyEffect"
            className="container mx-auto py-32 md:py-72 cursor-grab"
          >
            {/*
                bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400
            */}
            <span className="text-center block">
              Hier kommt auch bald{" "}
              <span className="text-md font-bold">ETWAS.... Neues</span>
              <span className="text-sm mt-12 block italic">Click here for</span>
              <span className="">
                <span className="text-red-400">C</span>
                <span className="text-yellow-400">o</span>
                <span className="text-blue-400">n</span>
                <span className="text-blue-500">f</span>
                <span className="text-lime-500">e</span>
                <span className="text-purple-600">t</span>
                <span className="text-emerald-500">t</span>
                <span className="text-orange-400">i</span>
              </span>
            </span>
          </div>
        </div>
      </Container>
      <Script src="https://cdn.jsdelivr.net/npm/party-js@latest/bundle/party.min.js" />
    </>
  );
}
