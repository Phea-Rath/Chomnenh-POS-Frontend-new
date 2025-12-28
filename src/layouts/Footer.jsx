import { Avatar, Badge, Space } from "antd";
import { useEffect, useState } from "react";
import { AiFillLike } from "react-icons/ai";
import { BsInboxesFill } from "react-icons/bs";
import { FaBalanceScaleLeft } from "react-icons/fa";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { GiCoalWagon, GiMoneyStack, GiResize } from "react-icons/gi";
import { GrDocumentStore, GrSettingsOption } from "react-icons/gr";
import { HiHome } from "react-icons/hi";
import { IoColorPaletteSharp } from "react-icons/io5";
import { MdCategory } from "react-icons/md";
import { PiShoppingCartBold } from "react-icons/pi";
import { RiStore3Line } from "react-icons/ri";
import { Link, useLocation, useNavigate } from "react-router";
import { useOutletsContext } from "./Management";
import { useGetAllMenuQuery } from "../../app/Features/menusSlice";
import {
  useGetAllPermissionQuery,
  useGetPermissionByIdQuery,
} from "../../app/Features/permissionSlice";
import { useGetExchangeRateByIdQuery } from "../../app/Features/exchangeRatesSlice";
const iconComponents = {
  AiFillLike: AiFillLike,
  BsInboxesFill: BsInboxesFill,
  FaBalanceScaleLeft: FaBalanceScaleLeft,
  FaMoneyBillTrendUp: FaMoneyBillTrendUp,
  GiCoalWagon: GiCoalWagon,
  GiMoneyStack: GiMoneyStack,
  GiResize: GiResize,
  GrDocumentStore: GrDocumentStore,
  GrSettingsOption: GrSettingsOption,
  HiHome: HiHome,
  IoColorPaletteSharp: IoColorPaletteSharp,
  MdCategory: MdCategory,
  PiShoppingCartBold: PiShoppingCartBold,
  RiStore3Line: RiStore3Line,
};
const Footer = () => {
  const navigetor = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const proId = localStorage.getItem("profileId");
  const paths = useLocation();
  const [data, setData] = useState([]);
  const [dataSm, setDataSm] = useState([]);
  const [count, setCount] = useState(0);
  const { setOpen, orderCount, setOrderCount } = useOutletsContext();
  const { data: permData } = useGetPermissionByIdQuery({ id: userId, token });
  useGetExchangeRateByIdQuery({ id: proId, token });

  useEffect(() => {
    setOrderCount(
      JSON.parse(localStorage.getItem("orderItems"))?.items?.reduce(
        (init, curr) => init + curr.quantity,
        0
      )
    );
    const menuData =
      permData?.data ?? JSON.parse(localStorage.getItem("menus"));
    if (menuData?.length != 0) {
      const menus = menuData?.filter(
        (i) => i.menu_type == 1 || i.menu_type == 0
      );

      const menuSm = menuData?.filter((i) => i.menu_type == 0);
      setData(menus);
      setDataSm(menuSm);
    }
  }, [permData]);

  function handleMenu(path) {
    setData((prev) =>
      prev?.map((item) => ({
        ...item,
        active: item.menu_path === path,
      }))
    );
    setDataSm((prev) =>
      prev?.map((item) => ({
        ...item,
        active: item.menu_path === path,
      }))
    );

    // Delay navigation & state update to after render
    setTimeout(() => {
      if (
        path === "/dashboard/orders" &&
        paths.pathname === "/dashboard/orders"
      ) {
        showDrawer();
      } else {
        setOrderCount(
          JSON.parse(localStorage.getItem("orderItems"))?.items?.reduce(
            (init, curr) => init + curr.quantity,
            0
          )
        );
        navigetor(path);
      }
    }, 0);
  }

  useEffect(() => {
    setData((prev) =>
      prev?.map((item) => {
        if (item.menu_path === paths.pathname) {
          return { ...item, active: true };
        } else {
          return { ...item, active: false };
        }
        // return item;
      })
    );
    setDataSm((prev) =>
      prev?.map((item) => {
        if (item.menu_path === paths.pathname) {
          if (item.menu_path === "/dashboard/orders") {
            return { ...item, active: true, count: orderCount };
          } else {
            return { ...item, active: true };
          }
        } else {
          if (item.meun_path === "/dashboard/orders") {
            return { ...item, active: false, count: orderCount };
          } else {
            return { ...item, active: false };
          }
        }
        // return item;
      })
    );
  }, [orderCount]);

  const showDrawer = () => {
    setOpen(true);
  };
  const renderIcon = (iconName) => {
    const IconComponent = iconComponents[String(iconName)];
    return IconComponent ? <IconComponent /> : <HiHome />; // Default icon
  };

  return (
    <section>
      <div className="dock dock-md hidden lg:flex drop-shadow-xl bg-white">
        {data?.map(({ menu_name, menu_icon, menu_path, active }, index) => (
          <Space
            key={index}
            direction="vertical"
            onClick={() => handleMenu(menu_path)}
            className={active ? " ml-3 dock-active text-warning" : " ml-3"}
          >
            <Space size="large">
              <Badge
                count={menu_name.toLowerCase() == "orders" ? orderCount : 0}
                className="flex flex-col justify-center items-center text-center"
              >
                <div className="text-2xl text-info mx-auto text-center flex justify-center">
                  {renderIcon(menu_icon)}
                </div>
                <span className="dock-label">{menu_name}</span>
              </Badge>
            </Space>
          </Space>
        ))}
      </div>
      <div className="dock dock-md bg-white lg:hidden">
        {dataSm?.map(
          ({ menu_name, menu_path, menu_icon, id, active, count }, index) => (
            <Space
              key={index}
              direction="vertical"
              onClick={() => handleMenu(menu_path)}
              className={active ? " ml-3 dock-active text-warning" : " ml-3"}
            >
              <Space size="large">
                <Badge
                  count={menu_name.toLowerCase() == "orders" ? orderCount : 0}
                  className="flex flex-col justify-center items-center text-center"
                >
                  <div className="text-2xl text-accent mx-auto text-center flex justify-center">
                    {renderIcon(menu_icon)}
                  </div>
                  <span className="dock-label">{menu_name}</span>
                </Badge>
              </Space>
            </Space>
          )
        )}
      </div>
    </section>
  );
};

export default Footer;
