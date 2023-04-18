const ProjectTitleAndStatus = ({ ...item }) => {
  return (
    <h3 key={item.title} className="relative mb-4 text-base font-medium">
      {item.title}
      <span
        className={`${
          item.online
            ? "bg-emerald-400"
            : !item.finished
            ? "bg-yellow-300"
            : "bg-red-500"
        } group ml-2 inline-block h-2.5 w-2.5 rounded-full`}
      >
        {" "}
        <span className="invisible absolute bottom-5 z-50 -translate-x-7 rounded-md bg-black p-1 px-2 text-white duration-200 group-hover:visible">
          {item.online ? "Online" : !item.finished ? "In review" : "Offline"}
        </span>
      </span>
    </h3>
  );
};

export default ProjectTitleAndStatus;
