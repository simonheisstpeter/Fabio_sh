import React from "react";

const ScrollToTop = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      className="text-fontColor border-gold bg-goldHover fixed bottom-6 right-6 h-8 w-8 rounded-lg border text-center text-xl focus:outline-2 outline-emerald-400"
      onClick={scrollToTop}
      aria-label="Scroll to Top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 translate-x-[3px]"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
      <span className="sr-only">Scroll to Top</span>
    </button>
  );
};

export default ScrollToTop;
