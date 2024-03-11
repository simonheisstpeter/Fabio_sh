const Card = ({ itemKey, ...item }) => {
  return (
    <article
      className={`
        ${
          itemKey === 0
            ? "lg:row-span-2 lg:col-start-1 lg:row-start-1"
            : "lg:col-span-2"
        }
        h-full select-none opacity-50 p-2 bg-gradient-to-t from-white/20 ring-1 ring-white/10 rounded-3xl transform hover:-translate-y-2 duration-300 ease-in-out
      `}
    >
      <div className="flex flex-col justify-between h-full p-4 overflow-hidden shadow-md ring-1 ring-white/10 rounded-2xl bg-[#030303]">
        <h2 className="text-lg text-white font-display lg:text-xl">
          {item.title}
        </h2>
        <p className="text-sm text-neutral-300">{item.text}</p>
      </div>
    </article>
  );
};

export default Card;
