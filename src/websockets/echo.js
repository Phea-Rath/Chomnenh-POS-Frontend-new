import Echo from "laravel-echo";
import baseUrl from "@/services/baseUrl";
import { getToken } from "@/utils/tokenStore";

window.Echo = new Echo({
    broadcaster: "reverb",
    key: "mofytlf0bipddani4rrv",

    wsHost: import.meta.env.VITE_WS_HOST || "api.chomnenhapp.com",
    wsPort: 443,
    wssPort: 443,
    forceTLS: true,

    // ❗ DO NOT force transports for Reverb
    // enabledTransports: ["wss"], //❌ REMOVE

    // wsHost: import.meta.env.VITE_WS_HOST,
    // wsPort: 6001,
    // wssPort: 6001,
    // forceTLS: false,
    // encrypted: false,
    // enabledTransports: ["ws", "wss"], // ⬅️ THIS FIXES ws://443

    authEndpoint: `${baseUrl}/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    },
});

export default window.Echo;
