import { useEffect, useState } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaMoon,
  FaSun,
  FaTelegram,
  FaUser,
} from "react-icons/fa";
import { FiPhone } from "react-icons/fi";
import { IoIosArrowDown, IoIosArrowDropdown } from "react-icons/io";
import {
  IoLocateOutline,
  IoLocationOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { LiaShoppingBasketSolid } from "react-icons/lia";

export default function HeaderPanel() {
  const [theme, setTheme] = useState(localStorage.getItem("theme"));
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }, []);
  const handleDarkMode = () => {
    if (theme == "light") {
      localStorage.theme = "dark";
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      localStorage.theme = "light";
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  };

  return (
    <section className="">
      <article className=" border-b-1 border-gray-400">
        <div className="container mx-auto px-4 flex justify-between p-2 text-xs">
          <div className="">
            <ul className="flex">
              <li className="flex gap-2 items-center pr-3">
                <IoLocationOutline />
                <h1>36d Street 371</h1>
              </li>
              <li className="flex gap-2 items-center pl-3">
                <FiPhone />
                <h1>+855 979 797 977</h1>
              </li>
            </ul>
          </div>
          <div>
            <ul className="flex">
              <li className="flex gap-2 px-3 border-r-1 border-gray-400 items-center">
                USD <IoIosArrowDown />
              </li>
              <li className="flex gap-2 px-3 border-r-1 border-gray-400 items-center">
                English
                <IoIosArrowDown />
              </li>
              <li className="flex gap-2 px-3 border-r-1 border-gray-400 items-center">
                <FaFacebook />
                <FaInstagram />
                <FaTelegram />
              </li>
              <li className="flex gap-2 px-3 items-center">
                {theme == "dark" ? (
                  <FaSun onClick={handleDarkMode} className="cursor-pointer" />
                ) : (
                  <FaMoon onClick={handleDarkMode} className="cursor-pointer" />
                )}
              </li>
            </ul>
          </div>
        </div>
      </article>
      <article className="container mx-auto px-4 flex justify-between p-4">
        <div>
          <h1 className="text-2xl font-medium">
            e-market<span className="text-orange-400">.</span>
          </h1>
        </div>
        <div className="text-xs">
          <ul className="flex px-5">
            <li>
              <input
                type="text"
                placeholder="Search Products. . ."
                className="border rounded-lg p-2 px-6 border-gray-400"
              />
              <IoSearchOutline className="-mt-6 m-2" />
            </li>
            <li className="flex items-center px-5 border-r gap-2">
              <LiaShoppingBasketSolid className="text-2xl" />
              <ul>
                <li>Cart</li>
                <li>$150.00</li>
              </ul>
            </li>
            <li className="flex items-center px-5 gap-2">
              <FaUser className="text-2xl" />
              <ul>
                <li>User</li>
                <li>Account</li>
              </ul>
            </li>
          </ul>
        </div>
      </article>
    </section>
  );
}
