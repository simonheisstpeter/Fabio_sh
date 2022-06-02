const Footer = () => {
  const email = "fabio@fabio.sh";

  return (
    <>
      <div className="container mx-auto p-6 md:p-12 md:pt-52 pt-44">
        <p>Email</p>
        <a
          href={`mailto:${email}`}
          className="text-gray-700 dark:text-white hover:text-emerald-400 transition duration-300"
        >
          {email}
        </a>
      </div>
    </>
  );
};

export default Footer;
