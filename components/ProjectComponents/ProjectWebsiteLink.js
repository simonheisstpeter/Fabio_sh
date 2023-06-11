const ProjectWebsiteLink = ({ text, ...item }) => {
  return (
    <span
      className={`group block text-emerald-400 duration-300 hover:text-emerald-500  font-andesNeueLight`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.title}
      href={item.url}
    >
      {text}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="inline h-4 w-4 -translate-y-[1px] opacity-0 duration-200 group-hover:translate-x-1 group-hover:opacity-100"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>
    </span>
  );
};

export default ProjectWebsiteLink;
