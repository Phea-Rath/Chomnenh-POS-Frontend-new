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
<<<<<<< HEAD
    authEndpoint: `${baseUrl}/broadcasting/auth`,
=======
    authEndpoint: 'https://api.chomnenhapp.com/broadcasting/auth',
>>>>>>> 9505cd1e90c9eee4c6916e19339f8d4e66d0f090

    auth: {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    },
});

export default echo;
