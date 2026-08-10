import React, { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { toast } from "react-toastify";
import Echo from "@/websockets/echo";
import { useGetAllOrderQuery, useGetOrderByUserQuery } from "@/features/sales/ordersSlice";
import { useGetAllItemsQuery } from "@/features/products/itemsSlice";
import { useGetAllSaleQuery } from "@/features/sales/salesSlice";
import { useGetAllOrderOnlineQuery, useGetAllWasteQuery } from "@/features/system/notificationSlice";
import router from "@/routes/AppRoutes";
import { getToken } from "@/utils/tokenStore";

function App() {
  const [authState, setAuthState] = useState(() => ({
    // Token read from in-memory tokenStore (initialized from sessionStorage on load)
    // NOT from localStorage — prevents XSS from reading it via localStorage.getItem('token')
    token: getToken() || "",
    guestId: localStorage.getItem("guestId") || JSON.parse(localStorage.getItem("guest") || "null")?.id || "",
    profileId: localStorage.getItem("profileId") || "",
    userId: localStorage.getItem("userId") || "",
  }));

  const { token, guestId, profileId, userId } = authState;

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState({
        token: getToken() || "",
        guestId: localStorage.getItem("guestId") || JSON.parse(localStorage.getItem("guest") || "null")?.id || "",
        profileId: localStorage.getItem("profileId") || "",
        userId: localStorage.getItem("userId") || "",
      });
    };

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-changed", syncAuthState);
    };
  }, []);

  const { refetch: refetchWaste } = useGetAllWasteQuery(token, { skip: !token });
  const { refetch: refetchOnline } = useGetAllOrderOnlineQuery(token, { skip: !token });
  const { refetch: refetchOrder } = useGetAllOrderQuery(token, { skip: !token });
  const { refetch: refetchSale } = useGetAllSaleQuery(
    { token, limit: 10, page: 1, search: "" },
    { skip: !token }
  );
  const { refetch: refetchItem } = useGetAllItemsQuery(
    { token, limit: 10, page: 1, search: "" },
    { skip: !token }
  );
  const { refetch: refetchGuestOrder } = useGetOrderByUserQuery(
    { id: guestId, token },
    { skip: !token || !guestId }
  );

  const shouldMuteRealtimeOrderAlerts = () =>
    typeof document !== "undefined" &&
    document.body?.dataset?.muteRealtimeOrderAlerts === "true";

  const shouldMuteRealtimeOrderAudio = () =>
    typeof document !== "undefined" &&
    document.body?.dataset?.muteRealtimeOrderAudio === "true";

  useEffect(() => {
    const privateChannel = profileId ? `my-private-channel.user.${profileId}` : null;
    const onlineChannel = profileId ? `check-online.user.${profileId}` : null;

    if (token && Echo?.connector?.options?.auth?.headers) {
      Echo.connector.options.auth.headers.Authorization = `Bearer ${token}`;
    }

    if (privateChannel) {
      Echo.private(privateChannel).listen("PrivateChannelEvent", (data) => {
        if (!shouldMuteRealtimeOrderAudio()) {
          const audio = new Audio("/sounds/auto.wav");
          audio.currentTime = 0;
          audio.play().catch((err) => console.log("Sound blocked:", err));
        }

        if (!shouldMuteRealtimeOrderAlerts()) {
          toast.info(`New orders by ${data.data}`);
        }

        if (token) {
          refetchWaste();
          refetchOnline();
          refetchSale();
          refetchItem();
        }
      });
    }

    if (onlineChannel) {
      Echo.private(onlineChannel).listen("OnlineEvent", (data) => {
        // toast.info(`Order tracking updated ${data.data}`);
        if (token) {
          refetchSale();
          refetchOnline();
          refetchOrder();
        }

        if (token && guestId) {
          refetchGuestOrder();
        }
      });
    }

    Echo.channel("my-public-channel").listen("PublicChannelEvent", (data) => {
      if (!shouldMuteRealtimeOrderAudio()) {
        const audio = new Audio("/sounds/auto.wav");
        audio.currentTime = 0;
        audio.play().catch((err) => console.log("Sound blocked:", err));
      }

      if (!shouldMuteRealtimeOrderAlerts()) {
        toast.info(`New orders by ${data.message}`);
      }
    });

    return () => {
      if (privateChannel) Echo.leave(privateChannel);
      if (onlineChannel) Echo.leave(onlineChannel);
      Echo.leave("my-public-channel");
    };
  }, [guestId, profileId, refetchGuestOrder, refetchItem, refetchOnline, refetchOrder, refetchSale, refetchWaste, token]);

  return <RouterProvider router={router}></RouterProvider>;
}

export default App;

