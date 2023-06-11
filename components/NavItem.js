import Link from "next/link";
import { useRouter } from "next/router";
import PropTypes from "prop-types";

const NavItem = ({ href, text }) => {
  const router = useRouter();
  const isActive = router.asPath === href;

  return (
    <Link href={href}
        className={`${
          isActive ? "border-emerald-400 lg:border-b-2" : ""
        } mx-4 mb-6 inline-block cursor-pointer transition duration-300 ease-in-out hover:text-emerald-400 md:mb-0 font-andesNeueBook`}
        aria-current={isActive ? "page" : undefined}
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
