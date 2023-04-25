const Loader = ({ big }) => {
  return (
    <div className="mr-7 inline-block">
      <span
        className={`${
          big
            ? "h-[180px] w-[180px] before:animate-loaderRetourBig after:animate-loaderBig"
            : "h-7 w-7 translate-y-1.5 before:animate-loaderRetourSmall after:animate-loaderSmall"
        } before:content after:content relative mx-auto block before:absolute before:inset-0 before:rounded-full before:bg-darkDotsGray bg- before:dark:bg-gray-200 before:duration-200 after:absolute after:inset-0 after:z-[1] after:rounded-full after:border-[1px] after:border-loaderBorder after:bg-loaderAlpha after:backdrop-blur-[10px] hover:before:bg-emerald-400 dark:hover:before:bg-emerald-400`}
      />
    </div>
  );
};

export default Loader;
