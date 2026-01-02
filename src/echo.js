import Echo from "laravel-echo";
import Pusher from "pusher-js";

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
    authEndpoint: 'http://206.189.155.96/broadcasting/auth',

    auth: {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    },
});

export default echo;
