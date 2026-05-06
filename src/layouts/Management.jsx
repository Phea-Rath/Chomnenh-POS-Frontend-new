import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigation, useParams } from 'react-router'
import Header from './Header'
import Footer from './Footer'
import Loading from '../services/Loading';
import AlertMessage from '../services/AlertMessage';
import Sidebar from './Sidebar';
import { useGetAllOrderOnlineQuery, useGetAllWasteQuery } from '../../app/Features/notificationSlice';
import { toast, ToastContainer } from 'react-toastify';
import echo from '../echo';
import { useGetAllUserQuery, useGetUserLoginQuery } from '../../app/Features/usersSlice';
import { useGetAllSaleQuery } from '../../app/Features/salesSlice';
import { useGetAllItemsQuery } from '../../app/Features/itemsSlice';
import { useGetPermissionByIdQuery } from '../../app/Features/permissionSlice';
import { useGetAllOrderQuery, useGetOrderByUserQuery } from '../../app/Features/ordersSlice';
const outletContext = createContext();
export const useOutletsContext = () => useContext(outletContext);


const Management = () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const guestId = localStorage.getItem('guestId');
  const profileId = localStorage.getItem('profileId');
  const { data: dataWaste, isLoading, refetch } = useGetAllWasteQuery(token);
  const { data: dataOrderOnline, isLoading: isLoadingOnline, refetch: refetchOnline } = useGetAllOrderOnlineQuery(token);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(false);
  const [reload, setReload] = useState(false);
  const [message, setMessage] = useState("");
  const [alertStatus, setAlertStatus] = useState(false);
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState(false);
  const [orderCount, setOrderCount] = useState(0)
  const [sidebar, setSidebar] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const { data } = useGetUserLoginQuery(token);
  const { refetch: refetchOrder } = useGetAllOrderQuery({
    token,
    limit: 10,
    page: 1,
    search: ''
  });
  const { refetch: refetchSale } = useGetAllSaleQuery({
    token,
    limit: 10,
    page: 1,
    search: ''
  });
  const { refetch: refetchItem } = useGetAllItemsQuery({
    token,
    limit: 10,
    page: 1,
    search: ''
  });
  const { refetch: refetchGuestOrder } = useGetOrderByUserQuery({ id: guestId, token });
  const { refetch: userRefetch } = useGetAllUserQuery(token);
  const { data: permission } = useGetPermissionByIdQuery({ id: userId, token });
  const { pathname } = useLocation();
  const topRef = useRef();

  useEffect(() => {
    topRef.current.scrollTop = 0;
  }, [pathname]);
  useEffect(() => {
    if (permission) {
      localStorage.setItem('menus', JSON.stringify(permission?.data))
    }
  }, [permission]);


  useEffect(() => {
    setNotification(dataWaste?.data?.length + dataOrderOnline?.data?.length);
  }, [dataOrderOnline, dataWaste, data])

  useEffect(() => {
    userRefetch();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setAlert(false);
    }, 5000)
  }, [alert]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  const renderAlertMessage = (message) => {
    if (!message) return "";
    if (typeof message === 'string') return message;
    if (message instanceof Error) return message.message;
    if (typeof message === 'object') return JSON.stringify(message);
    return String(message);
  };
  return (
    <outletContext.Provider value={
      {
        setAlert,
        setMessage,
        setAlertStatus,
        setReload,
        reload,
        open,
        setOpen,
        setLoading,
        loading,
        sidebar,
        setSidebar,
        darkMode,
        setDarkMode,
        orderCount,
        setOrderCount,
        notification,
        setNotification
      }}>
      <ToastContainer position="top-right" autoClose={2000} />
      {loading ? <Loading /> : ""}
      <section className={`h-[100vh] flex ${darkMode ? "bg-gray-900" : "bg-sky-50"}`}>
        {data?.data?.role_id !== 1 && <Sidebar darkMode={darkMode} />}
        <div>
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          <AlertMessage show={alert} message={renderAlertMessage(message)} status={alertStatus} className="z-[9999]" />
          <main ref={topRef} className={`h-[calc(100vh)] ${data?.data?.role_id !== 1 ? (sidebar ? "lg:w-[calc(100vw-250px)]" : "lg:w-[calc(100vw-80px)]") : ""} pt-[86px] overflow-auto m-0 w-[100vw] p-4 ${darkMode ? "!bg-[#21335e] !text-white" : "!bg-[#F8FAFC] !text-black"}`}>
            {/* <div className='absolute -z-0 top-0 right-0 w-2/5 h-full bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none' /> */}
            <Outlet />
          </main>
        </div>
        {/* <Footer /> */}
      </section>
    </outletContext.Provider>
  )
}

export default Management
