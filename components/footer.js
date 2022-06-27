const Footer = () => {
  const email = "fabio@fabio.sh";

  return (
    <>
      <footer className="container mx-auto p-6 md:p-12">
        <p>Email</p>
        <a
          href={`mailto:${email}`}
          className="text-gray-700 dark:text-white hover:text-emerald-400 transition duration-300"
        >
          {email}
        </a>
      </footer>
    </>
  );
};

export default Footer;
