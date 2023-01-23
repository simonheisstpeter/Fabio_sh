import Link from "next/link";
import { useRouter } from "next/router";

export default function NavItem({ href, text }) {
  const router = useRouter();
  const isActive = router.asPath === href;

  return (
    <Link
      href={href}
      aria-label={text}
      aria-controls="menu"
      className={`${
        isActive ? "lg:border-b-2 border-emerald-300" : ""
      } mx-4 mb-6 md:mb-0 transition duration-300 ease-in-out hover:text-emerald-300 inline-block`}
    >
      {text}
    </Link>
  );
}
