import party from "party-js";

const Confetti = () => {
  const buttonEffect = () => {
    document
      .getElementById("partyEffect")
      .addEventListener("click", function (e) {
        party.confetti(this, {
          count: party.variation.range(0, 50),
          size: party.variation.range(0.6, 1.4),
        });
      });
  };

  return (
    <div
      id="partyEffect"
      className="mx-auto py-32 md:py-72"
      onClick={buttonEffect}
    >
      <span className="block select-none text-center">
        <span className="mb-2 mt-12 block text-sm italic">Click here for</span>
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
