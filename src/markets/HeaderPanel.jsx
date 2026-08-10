import { useEffect, useState } from "react";
import {
  FaBars,
  FaCheck,
  FaPhone,
  FaSearch,
  FaShoppingCart,
  FaUser,
} from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import { useNavigate } from "react-router";
import Modal from "./components/Modal";
import Button from "./components/Button";
import Input from "./components/Input";
import api from "../services/api";
import { toast } from "react-toastify";

import { setGuestToken } from "@/utils/tokenStore";

export default function HeaderPanel() {
  const [openModal, setOpenModal] = useState(false);
  const [tel, setTel] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  function onBack() {
    navigate('/market');
  }
  function cart() {
    navigate('shopping-cart');
  }
  const [theme, setTheme] = useState(localStorage.getItem("theme"));
  const [countCart, setCountCart] = useState(0);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('productOrder') || '[]');
    const total = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
    setCountCart(total);
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }, []);

  const hanldeSignIn = async (e) => {
    e.preventDefault();
    if (!tel || tel.length < 9) {
      toast.error('Invalid phone number, at least 9 digits.')
      return;
    }
    setLoading(true);

    try {
      const response = await api.post(`/guest/${tel}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const {
        token: userToken,
        user,
      } = response.data;

      setGuestToken(userToken);
      localStorage.setItem("guest", JSON.stringify(user));
      if (user?.id) {
        localStorage.setItem("guestId", user.id);
      }
      if (id) {
        localStorage.setItem("profileId", id);
      }
      if (Echo?.connector?.options?.auth?.headers) {
        Echo.connector.options.auth.headers.Authorization = `Bearer ${userToken}`;
      }
      window.dispatchEvent(new Event("auth-changed"));
      if (!loading) {
        toast.success("SingIn successful");
        setShowSignInModal(false);
        setUser(user);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        "An error occurred during login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="bg-chomnenh-dark text-white py-2 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex flex-col gap-2">
        {/* Top Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Menu */}
          <div className="flex items-center gap-1">
            {/* <button className="p-2 hover:border border-white border-transparent md:hidden">
              <FaBars className="text-xl" />
            </button> */}
            <div onClick={onBack} className="flex items-center border border-transparent hover:border-white p-2 cursor-pointer">
              <h1 className="text-xl md:text-2xl font-bold whitespace-nowrap">
                CHOMNENH<span className="text-[#febd69]">.STORE</span>
              </h1>
            </div>
          </div>

          {/* Deliver to (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center border border-transparent hover:border-white p-2 cursor-pointer">
            <IoLocationOutline className="text-xl mt-2" />
            <div className="ml-1">
              <p className="text-xs text-gray-300 leading-none">Deliver to</p>
              <p className="text-sm font-bold leading-none mt-1">Cambodia</p>
            </div>
          </div>

          {/* Search Bar (Desktop only in top row) */}
          <div className="hidden md:flex flex-1 items-center h-10 max-w-2xl mx-4">
            {/* <select className="bg-gray-100 text-gray-700 h-full px-2 rounded-l-md border-r border-gray-300 text-xs focus:outline-none cursor-pointer hover:bg-gray-200">
              <option>All</option>
              <option>Electronics</option>
              <option>Fashion</option>
            </select> */}
            <input
              type="text"
              placeholder="Search. . ."
              className="flex-1 h-full px-4 !text-black bg-slate-100 rounded-l-md focus:outline-none"
            />
            <button className="bg-[#febd69] hover:bg-[#f3a847] h-full px-5 rounded-r-md flex items-center justify-center">
              <FaSearch className="text-black text-xl" />
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1">
            {/* Account */}
            <div onClick={() => setOpenModal(true)} className="border border-transparent hover:border-white p-1 md:p-2 cursor-pointer">
              <p className="text-[10px] md:text-xs leading-none hidden sm:block">Hello, sign in</p>
              <p className="text-xs md:text-sm font-bold leading-none mt-1 flex items-center">
                <span className="hidden sm:inline">Account</span>
                <FaUser className="sm:hidden text-lg" />
              </p>
            </div>

            {/* Orders (Desktop only) */}
            <div className="hidden md:block border border-transparent hover:border-white p-2 cursor-pointer">
              <p className="text-xs leading-none">Returns</p>
              <p className="text-sm font-bold leading-none mt-1">& Orders</p>
            </div>

            {/* Cart */}
            <div onClick={cart} className="flex items-end border border-transparent hover:border-white p-1 md:p-2 cursor-pointer relative">
              <div className="relative">
                <FaShoppingCart className="text-2xl md:text-3xl" />
                <span className="absolute -top-1 -right-2 bg-[#131921] text-[#febd69] text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-[#131921]">
                  {countCart}
                </span>
              </div>
              <span className="text-xs md:text-sm font-bold ml-1 mb-1 hidden sm:block">Cart</span>
            </div>
          </div>
        </div>

        <Modal
          open={openModal}
          onClose={() => setOpenModal(false)}
          width={400}
          darkMode={false}
        >
          <div className="p-5">
            <h3 className={`mb-4 flex items-center gap-2 text-lg font-bold text-black`}>
              <FaUser className="text-chomnenh-dark" /> Sign In Account
            </h3>
            <div className={`space-y-4`}>
              <div>
                <label className={`mb-1 block text-sm font-medium text-gray-800 `}>Phone Number</label>
                <Input
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="Enter your phone number"
                  icon={<FaPhone className="text-gray-400" />}
                />
              </div>
              <div className={`flex justify-end gap-3 pt-4 border-t border-gray-400`}>
                <Button onClick={() => setOpenModal(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={hanldeSignIn} variant="primary" icon={<FaCheck />}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Mobile Search Row */}
        <div className="md:hidden flex items-center h-10 mb-1">
          <input
            type="text"
            placeholder="Search. . ."
            className="flex-1 h-full px-4 text-white focus:outline-none rounded-l-md"
          />
          <button className="bg-[#febd69] hover:bg-[#f3a847] h-full px-5 rounded-r-md flex items-center justify-center">
            <FaSearch className="text-black text-xl" />
          </button>
        </div>
      </div>
    </header>
  );
}
