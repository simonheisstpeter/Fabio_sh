const ExtraBox = ({ text }) => {
  return (
    <div className="flex min-h-[200px] lg:min-h-0 place-content-center items-center rounded-md border border-dotted border-gray-300 bg-white shadow-xs duration-200 hover:border-gray-400 hover:shadow-sm dark:bg-[#1d1d1f]">
      <p>{text}</p>
    </div>
  );
};

export default ExtraBox;
