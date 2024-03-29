import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const ThemeChanger = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);
  
  const switchTheme = () => {
    if (mounted) {
      setTheme(theme === "light" ? "dark" : "light");
    }
  };

  return (
    <div className="mx-auto translate-y-1.5 items-center justify-between text-xl font-bold md:inline-block focus:outline-2 outline-emerald-400">
      <button
        className="w-full text-emerald-400 dark:text-gray-100 md:w-6  focus:outline-2 outline-emerald-400"
        onClick={switchTheme}
        aria-label="Change theme"
      >
        {theme === "dark" ? (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            id="moon"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            ></path>
          </svg>
        )}
      </button>
    </div>
  );
};

export default ThemeChanger;
