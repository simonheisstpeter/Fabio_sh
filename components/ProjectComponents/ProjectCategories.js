import { useId } from "react";

const ProjectCategories = ({ category }) => {
  const keyId = useId();
  return (
    <span
      key={keyId}
      className="mb-1 mr-1 inline-block rounded-xl border-[0.5px] p-1 px-2 text-[0.8em] dark:border-gray-400 dark:text-gray-400  font-andesNeueExtraLight"
    >
      {category}
    </span>
  );
};

export default ProjectCategories;
