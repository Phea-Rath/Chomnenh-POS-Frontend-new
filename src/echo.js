import Echo from "laravel-echo";
import Pusher from "pusher-js";
import baseUrl from "./services/baseUrl";

window.Pusher = Pusher;
const token = localStorage.getItem('token');

const echo = new Echo({
    broadcaster: 'reverb',
    key: 'mofytlf0bipddani4rrv',
    wsHost: "localhost",
    wsPort: 8080,
    // disableStats: true,
    forceTLS: false,
    encrypted: false,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${baseUrl}/broadcasting/auth`,

    auth: {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    },
});

export default echo;
