const ExtraBox = ({ text }) => {
  return (
    <div className="flex place-content-center items-center rounded-md border border-dotted border-gray-300 bg-white shadow-sm duration-200 hover:border-gray-400 hover:shadow dark:bg-[#1d1d1f]">
      <p>{text}</p>
    </div>
  );
};

export default ExtraBox;
