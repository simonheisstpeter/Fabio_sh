import Script from 'next/script';
import { useEffect } from "react";

export default function Project() {
  useEffect(() => {  
    
    document.getElementById("partyEffect").addEventListener("click", function (e) {
    party.confetti(this);
}); });
 

  return (<>
    <div className="h-full w-full">
      <div id="partyEffect" className="container mx-auto py-32 md:py-72 cursor-pointer">
        {/*
                bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400
            */}
        <span className="text-center block">
          Hier kommt auch bald{" "}
          <span className="text-md font-bold">ETWAS.... Neues</span>
        </span>
      </div>
    </div>
    <Script src="https://cdn.jsdelivr.net/npm/party-js@latest/bundle/party.min.js" />
    </>
  );
}
