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
        <span className="mb-2 mt-12 block text-sm italic">
          Click here for
        </span>
        <span className="block text-3xl">
          <span className="inline text-red-400 duration-300 hover:scale-105">
            C
          </span>
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
  );
};

export default Confetti;
