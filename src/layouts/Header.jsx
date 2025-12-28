import { FaAngleDown } from "react-icons/fa";
import { IoPersonCircleOutline } from "react-icons/io5";
import { Link } from "react-router";
import { useOutletsContext } from "./Management";
import { BiBell, BiMenuAltLeft } from "react-icons/bi";
import { useGetUserLoginQuery } from "../../app/Features/usersSlice";
import { useEffect, useState } from "react";
import { Badge, Space } from "antd";

const Header = () => {
  const { setSidebar, notification } = useOutletsContext();
  const token = localStorage.getItem("token");
  const { data, refetch } = useGetUserLoginQuery(token);
  const [profile, setProfile] = useState();

  useEffect(() => {
    setProfile(data?.data);
  }, [data]);

  function showDrawer() {
    setSidebar(true);
  }

  return (
    <header className="fixed w-full lg:w-[calc(100vw-346px)] top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex justify-between items-center px-4 lg:px-8 py-3">
        {/* Left Section - Logo and Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={showDrawer}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <BiMenuAltLeft className="text-2xl text-blue-600" />
          </button>

          <Link
            to="/dashboard/analystic"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <h1 className="font-bold text-gray-400 text-sm">
              {" "}
              <span className="text-info font-extrabold text-4xl">e</span>
              <span className="text-4xl text-warning">.</span>STORE
            </h1>
          </Link>
        </div>

        {/* Right Section - User and Notifications */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <Link
            to="/dashboard/notification"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Badge
              count={notification || 0}
              size="small"
              className="flex items-center justify-center"
            >
              <BiBell className="text-xl text-gray-600 hover:text-blue-600 transition-colors" />
            </Badge>
          </Link>

          {/* User Profile Dropdown */}
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {!profile?.image ? (
                  <IoPersonCircleOutline className="text-3xl text-gray-500" />
                ) : (
                  <img
                    src={profile?.image}
                    className="w-8 h-8 rounded-full object-cover border border-gray-300"
                    alt="Profile"
                  />
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {profile?.username || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.role || "Admin"}
                  </p>
                </div>
                <FaAngleDown className="text-sm text-gray-500" />
              </div>
            </button>

            <ul
              tabIndex={0}
              className="dropdown-content menu bg-white rounded-lg shadow-lg border border-gray-200 w-48 p-2 mt-2"
            >
              <li>
                <Link
                  to={"/dashboard/profile/" + profile?.profile_id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
              </li>
              <li>
                <a
                  href="/"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
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