import React, { createContext, useContext, useEffect, useState } from 'react'
import { Outlet } from 'react-router'
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
import { useGetAllItemInStockQuery, useGetAllItemsQuery } from '../../app/Features/itemsSlice';
import { useGetAllPermissionQuery } from '../../app/Features/permissionSlice';
import { Atom, BlinkBlur, Slab } from 'react-loading-indicators';
import ScrollToTop from '../services/ScrollToTop';
const outletContext = createContext();
export const useOutletsContext = () => useContext(outletContext);


const Management = () => {
  const token = localStorage.getItem('token');
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
  const { data } = useGetUserLoginQuery(token);
  const { refetch: refetchSale } = useGetAllSaleQuery(token);
  const { refetch: refetchItem } = useGetAllItemsQuery(token);
  const { refetch: refetchItemInStock } = useGetAllItemInStockQuery(token);
  const { refetch: userRefetch } = useGetAllUserQuery(token);
  const { isLoading: perLoading } = useGetAllPermissionQuery(token);

  useEffect(() => {
    echo.private(`my-private-channel.user.${profileId}`).listen("PrivateChannelEvent", (data) => {
      const audio = new Audio("../../public/sounds/notification.mp3");
      audio.currentTime = 0; // restart from beginning
      audio.play().catch((err) => console.log("🔇 Sound blocked:", err));
      console.log("📡 Event received:", data); // 👈 Debug first
      toast.info(`💬 New orders by ${data.data}`);
      refetch();
      refetchOnline();
      refetchSale();
      refetchItem();
      refetchItemInStock();
    });
    echo.private(`check-online.user.${profileId}`).listen("OnlineEvent", (data) => {
      refetch();
      refetchOnline();
    });
    echo.channel("my-public-channel").listen("PublicChannelEvent", (data) => {
      const audio = new Audio("../../public/sounds/notification.mp3");
      audio.currentTime = 0; // restart from beginning
      audio.play().catch((err) => console.log("🔇 Sound blocked:", err));
      console.log("📡 Event received:", data); // 👈 Debug first
      toast.info(`💬 New orders by ${data.message}`);
    });

  }, []);
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
  const renderAlertMessage = (message) => {
    if (!message) return "";
    if (typeof message === 'string') return message;
    if (message instanceof Error) return message.message;
    if (typeof message === 'object') return JSON.stringify(message);
    return String(message);
  };
  // if (perLoading || isLoading) {
  //   return <div className='h-[100vh] flex justify-center items-center'>
  //     <Slab color={["#4d377f", "#7f3745", "#697f37", "#377f71"]} size="medium" text="Please wait data Loading . . ." textColor="#182693" />
  //   </div>
  // }
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
        orderCount,
        setOrderCount,
        notification,
        setNotification
      }}>
      {/* <ToastContainer position="top-right" autoClose={2000} /> */}
      {loading ? <Loading /> : ""}
      <section className={`bg-sky-50 h-[100vh] flex`}>
        {/* <div className={`h-[100vh] bg-gray-50/50 absolute z-1000 w-full flex justify-center items-center ${perLoading ? '' : 'hidden'}`}>
          <Slab color={["#fd377f", "#ff3745", "#f97f37", "#f77f71"]} size="medium" text="Please wait data Loading . . ." textColor="#ffffff" />
          <BlinkBlur color={["#ff3900", "#46ff00", "#00c6ff", "#b900ff"]} text="Please wait data Loading . . ." textColor="#ff3900" />
        </div> */}
        {/* <button className='btn btn-ghost' onClick={playNotification}>sound</button> */}
        <ScrollToTop />
        <Sidebar />
        <div>
          <Header />
          <AlertMessage show={alert} message={renderAlertMessage(message)} status={alertStatus} className="z-1000" />
          <main className='h-[calc(100vh)] pt-[86px] overflow-auto m-0 !text-black w-[100vw] p-4 lg:w-[calc(100vw-346px)]'>
            <Outlet />
          </main>
        </div>
        {/* <Footer /> */}
      </section>
    </outletContext.Provider>
  )
}

export default Management