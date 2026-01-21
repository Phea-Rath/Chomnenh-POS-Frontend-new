import React, { useEffect, useState } from "react";
import { MdManageAccounts } from "react-icons/md";
import { GiPadlock } from "react-icons/gi";
import { Link } from "react-router";
import { BsPersonRolodex } from "react-icons/bs";
import { BsMenuButtonWideFill } from "react-icons/bs";
import { FcCurrencyExchange } from "react-icons/fc";
import ExchangeRate from "../ExchangeRate";
import { useGetPermissionByIdQuery } from "../../../app/Features/permissionSlice";
import { useGetUserLoginQuery } from "../../../app/Features/usersSlice";
const iconComponents = {
  MdManageAccounts: MdManageAccounts,
  BsPersonRolodex: BsPersonRolodex,
  BsMenuButtonWideFill: BsMenuButtonWideFill,
  FcCurrencyExchange: FcCurrencyExchange,
  GiPadlock: GiPadlock,
};
const colors = [
  { main: "yellow-500", light: "yellow-50", text: "yellow-600" },
  { main: "blue-500", light: "blue-50", text: "blue-600" },
  { main: "green-500", light: "green-50", text: "green-600" },
  { main: "red-500", light: "red-50", text: "red-600" },
  { main: "purple-500", light: "purple-50", text: "purple-600" },
  { main: "pink-500", light: "pink-50", text: "pink-600" },
];

const Settings = () => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const [menu, setMenu] = useState([]);
  const { data: userLogin } = useGetUserLoginQuery(token);
  const { data } = useGetPermissionByIdQuery({ id: userId, token });

  useEffect(() => {
    if (data?.data.length != 0) {
      const perms = data?.data?.filter((i) => i.menu_type == 3);
      setMenu(perms);
    }
    console.log(userLogin);

  }, [data, userLogin]);
  const renderIcon = (iconName) => {
    const IconComponent = iconComponents[String(iconName)];
    return IconComponent ? <IconComponent /> : <AiFillProduct />; // Default icon
  };
  return (
    <section className="p-2 md:px-20">
      {userLogin?.data?.role_id == 2 || userLogin?.data?.role_id == 3 && <ExchangeRate />}
      <article className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-5 mt-5">
        {menu?.map((perm, index) => {
          const color = colors[index % colors.length]; // rotate colors
          return (
            <Link key={index} to={perm?.menu_path}>
              <button
                className={`
                  btn relative overflow-hidden rounded-tl-lg rounded-bl-lg group bg-white p-0
                  text-${color.text}
                  border-[#e5e5e5]
                  flex flex-col justify-center
                  w-full h-30 
                `}
              >
                <div
                  className={`absolute h-full left-0 w-full bg-${color.main} z-1`}
                ></div>
                <div
                  className={`absolute h-full left-[4px] rounded-md group-hover:left-2 transition-all duration-500 w-full bg-white/95 z-2`}
                ></div>
                <div className="flex flex-col justify-center items-center space-y-2 absolute w-full h-full z-3">
                  <div className={`text-4xl text-${color.main}`}>
                    {renderIcon(perm.menu_icon)}
                  </div>
                  <h1>{perm?.menu_name}</h1>
                </div>
              </button>
            </Link>
          );
        })}
      </article>
    </section>
  );
};

export default Settings;
