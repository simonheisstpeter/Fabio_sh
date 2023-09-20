import Link from "next/link";
import { useRouter } from "next/router";
import PropTypes from "prop-types";

const NavItem = ({ href, text }) => {
  const router = useRouter();
  const isActive = router.asPath === href;

  return (
    <Link href={href}
        className={`${
          isActive ? "text-emerald-500 border-emerald-500 lg:border-b-2" : ""
        } mx-4 mb-6 inline-block cursor-pointer transition duration-200 ease-in-out hover:text-emerald-500 md:mb-0 font-andesNeueLight focus:broder-emerald-400 focus:outline-2 outline-emerald-400`}
        aria-current={isActive ? "page" : undefined}
        tabIndex="0"
        role="button"
        aria-label={text}
      >
        {text}
    </Link>
  );
};

NavItem.propTypes = {
  href: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default NavItem;
