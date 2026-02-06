import Echo from "laravel-echo";
import Pusher from "pusher-js";
import baseUrl from "./services/baseUrl";

window.Pusher = Pusher;

const token = localStorage.getItem("token");

const echo = new Echo({
    broadcaster: "reverb",
    key: "mofytlf0bipddani4rrv",

    wsHost: "127.0.0.1",
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    encrypted: false,
    enabledTransports: ["ws", "wss"], // ⬅️ THIS FIXES ws://443
    // wsHost: "api.chomnenhapp.com",
    // wssPort: 443,
    // wsPort: 443,
    // forceTLS: true,
    // encrypted: true,
    // enabledTransports: ["wss"], // ⬅️ THIS FIXES ws://443

    authEndpoint: `${baseUrl}/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    },
});

export default echo;
