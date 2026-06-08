import { FaAngleDown, FaSun, FaMoon } from "react-icons/fa";
import { IoPersonCircleOutline } from "react-icons/io5";
import { Link } from "react-router";
import { useOutletsContext } from "./Management";
import { BiBell, BiMenuAltLeft, BiMenuAltRight, BiX } from "react-icons/bi";
import { useGetUserLoginQuery } from "../../app/Features/usersSlice";
import { useEffect, useState } from "react";
import { Badge, Space } from "antd";
import { useTranslation } from "react-i18next";
import api from "../services/api";

const Header = ({ darkMode, setDarkMode }) => {
  const { t, i18n } = useTranslation();
  const { setSidebar, notification, sidebar } = useOutletsContext();
  const token = localStorage.getItem("token");
  const uId = localStorage.getItem("userId");
  const { data } = useGetUserLoginQuery(token);
  const [profile, setProfile] = useState();

  const handleClearTelegramSession = () => {
    // 1. Wipe your own application's local tokens and user metadata
      localStorage.removeItem('token');
      sessionStorage.clear();

      // 2. Clear your local domain's cookies just to be thorough
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }

      // 3. Force Telegram to drop its widget cookie session
      // This logs them out of oauth.telegram.org and returns them right back to your page cleanly
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `https://oauth.telegram.org/logout?returnurl=${returnUrl}`;
  };

  const logout = async () => {
    try {
      const res = await api.post('/logout',{}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if(res.data.status === 200) {
        localStorage.clear();
        handleClearTelegramSession();
      } else {
        alert("Logout failed: " + res.data.message);
      }
    } catch (error) {
      alert("An error occurred during logout");
    
    }
    
  }

  

  useEffect(() => {
    setProfile(data?.data);
  }, [data]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "kh" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    localStorage.setItem("i18nextLng", newLang);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  function toggleSidebar() {
    setSidebar(!sidebar);
  }

  const headerWidthClass = data?.data?.role_id !== 1 ? (sidebar ? "lg:w-[calc(100vw-250px)]" : "lg:w-[calc(100vw-80px)]") : "w-full";

  return (
    <header className={`fixed shadow-sm no-print w-full drop-shadow-xs ${headerWidthClass} top-0 z-49 ${darkMode ? "bg-[#0f172a] border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="flex justify-between items-center px-4 lg:pr-8 py-2">
        {/* Left Section - Logo and Menu */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className={` rounded-lg transition-colors ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
            title={sidebar ? t("hideSidebar") : t("showSidebar")}
          >
            {sidebar ? (
              <BiMenuAltRight className={`text-2xl ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
            ) : (
              <BiMenuAltLeft className={`text-2xl ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
            )}
          </button>

          
        </div>

        {/* Right Section - User and Notifications */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-800 text-yellow-400" : "hover:bg-gray-100 text-gray-600"}`}
            title={darkMode ? t("lightMode") : t("darkMode")}
          >
            {darkMode ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${darkMode ? "hover:bg-gray-800 bg-gray-800 text-white" : "hover:bg-gray-100 bg-gray-100 text-gray-700"}`}
            title={i18n.language === "en" ? t("switchToKhmer") : t("switchToEnglish")}
          >
            {i18n.language === "en" ? "KH" : "EN"}
          </button>

          {/* Notification Bell */}
          {uId != 1 && <Link
            to="/notification"
            className={`relative p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <Badge
              count={notification || 0}
              size="small"
              className="flex items-center justify-center"
            >
              <BiBell className={`text-xl transition-colors ${darkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-600 hover:text-blue-600"}`} />
            </Badge>
          </Link>}

          {/* User Profile Dropdown */}
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
            >
              <div className="flex items-center gap-3">
                {!profile?.image ? (
                  <IoPersonCircleOutline className={`text-3xl ${darkMode ? "text-gray-500" : "text-gray-500"}`} />
                ) : (
                  <img
                    src={profile?.image}
                    className="w-8 h-8 rounded-full object-cover border border-gray-300"
                    alt="Profile"
                    onError={(e)=>e.target.src = import.meta.env.VITE_DEFAULT_PROFILE}
                  />
                )}
                <div className="hidden sm:block text-left">
                  <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {profile?.username || "User"}
                  </p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {profile?.role || "Admin"}
                  </p>
                </div>
                <FaAngleDown className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              </div>
            </button>

            <ul
              tabIndex={0}
              className={`dropdown-content menu rounded-lg shadow-lg border w-48 p-2 mt-2 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <li>
                <Link
                  to={"/user_detail/" + localStorage.getItem("userId")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-700"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t("profile")}
                </Link>
              </li>
              <li>
                <a
                  href="/"
                  onClick={logout}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-700"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("logout")}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
