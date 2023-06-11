import { useEffect, useRef } from "react";
import party from "party-js";

const Confetti = () => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;

    if (button) {
      const buttonEffect = () => {
        party.confetti(button, {
          count: party.variation.range(0, 50),
          size: party.variation.range(0.6, 1.4),
        });
      };

      button.addEventListener("click", buttonEffect);

      return () => {
        button.removeEventListener("click", buttonEffect);
      };
    }
  }, []);

  return (
    <div
      className="mx-auto py-32 md:py-72"
      onClick={() => buttonRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Click here for Confetti"
      ref={buttonRef}
    >
      <span className="block select-none text-center">
        <span className="mb-8 mt-12 block text-sm  font-andesNeueExtraLight">
          Click here for
        </span>
        <span className="text-3xl font-andesNeueMedium flex space-x-1 justify-center group">
          <span className="inline text-red-400 duration-200 hover:scale-105 group-hover:skew-y-3 group-hover:-translate-x-1 group-hover:-translate-y-3 group-hover:-rotate-12">
            C
          </span>
          <span className="text-yellow-400 duration-200 group-hover:translate-y-2 group-hover:-transalte-x-1 group-hover:-skew-x-3">o</span>
          <span className="text-blue-400 duration-200 group-hover:-translate-x-2 group-hover:-rotate-12 group-hover:-translate-y-4">n</span>
          <span className="text-blue-500 duration-200 group-hover:translate-x-1 group-hover:-translate-y-5 group-hover:rotate-16">f</span>
          <span className="text-lime-500 duration-200 group-hover:rotate-45 group-hover:-translate-x-1 group-hover:translate-y-4">e</span>
          <span className="text-purple-600 duration-200 group-hover:-rotate-12 group-hover:-translate-x-2 group-hover:-translate-y-1">t</span>
          <span className="text-emerald-500 duration-200 group-hover:rotate-45 group-hover:-translate-y-5 group-hover:-translate-x-1">t</span>
          <span className="text-orange-400 duration-200 group-hover:-rotate-45 group-hover:-translate-x-2 group-hover:translate-y-3">i</span>
        </span>
      </span>
    </div>
  );
};

export default Confetti;
