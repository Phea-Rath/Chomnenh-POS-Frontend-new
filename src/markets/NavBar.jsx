import { FaBars } from "react-icons/fa";
import { Link } from "react-router";

export default function NavBar() {
  const navLinks = [
    { label: "Today's Deals", link: "deals" },
    // { label: "Customer Service", link: "customer-service" },
    // { label: "Registry", link: "registry" },
    // { label: "Gift Cards", link: "gift-cards" },
    { label: "Companies", link: "companies" },
  ];

  return (
    <nav className="bg-chomnenh-light text-white py-1">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center gap-1 border border-transparent hover:border-white p-2 font-bold transition-all">
            <FaBars className="text-xl" />
            <span>All</span>
          </button>

          <ul className="flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link to={link.link}>
                <li
                  key={link.label}
                  className="px-2 py-2 text-sm border border-transparent hover:border-white cursor-pointer transition-all whitespace-nowrap"
                >
                  {link.label}
                </li>
              </Link>
            ))}
          </ul>
        </div>

        <div className="hidden md:block">
          <p className="text-sm font-bold border border-transparent hover:border-white p-2 cursor-pointer transition-all">
            Shop great deals now
          </p>
        </div>
      </div>
    </nav>
  );
}
