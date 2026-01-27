import Echo from "laravel-echo";
import Pusher from "pusher-js";
import baseUrl from "./services/baseUrl";

window.Pusher = Pusher;

const token = localStorage.getItem("token");

const echo = new Echo({
    broadcaster: "reverb",
    key: "mofytlf0bipddani4rrv",

    // wsHost: "localhost",
    // wsPort: 8080,
    // wssPort: 8080,
    // forceTLS: false,
    // encrypted: false,
    wsHost: "api.chomnenhapp.com",
    wsPort: 443,
    wssPort: 443,

    forceTLS: true,
    encrypted: true,

    enabledTransports: ["wss"], // ⬅️ THIS FIXES ws://443
    // enabledTransports: ["ws", "wss"], // ⬅️ THIS FIXES ws://443

    authEndpoint: `${baseUrl}/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    },
});

export default echo;
