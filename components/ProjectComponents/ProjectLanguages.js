import { useId } from "react";

const ProjectLanguages = ({ language }) => {
  const keyId = useId();

  return (
    <span
      key={keyId}
      className="group relative mr-1 grayscale hover:grayscale-0"
    >
      <span aria-hidden="true">{language.flag}</span>
      <span className="invisible absolute bottom-5 z-50 min-w-[60px] -translate-x-11 rounded-md bg-black p-1 px-2 text-white group-hover:visible dark:bg-emerald-400 dark:text-white">
        {language.lang}
      </span>
    </span>
  );
};

export default ProjectLanguages;
