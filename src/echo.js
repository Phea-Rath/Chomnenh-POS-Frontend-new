
import Echo from "laravel-echo";
import baseUrl from "./services/baseUrl";

const token = localStorage.getItem("token");

window.Echo = new Echo({
    broadcaster: "reverb",
    key: "mofytlf0bipddani4rrv",

    wsHost: "api.chomnenhapp.com",
    wsPort: 443,
    wssPort: 443,
    forceTLS: true,

    // ❗ DO NOT force transports for Reverb
    // enabledTransports: ["wss"], ❌ REMOVE

    // wsHost: "127.0.0.1",
    // wsPort: 6001,
    // wssPort: 6001,
    // forceTLS: false,
    // encrypted: false,
    // enabledTransports: ["ws", "wss"], // ⬅️ THIS FIXES ws://443

    authEndpoint: `${baseUrl}/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    },
});

export default window.Echo;
