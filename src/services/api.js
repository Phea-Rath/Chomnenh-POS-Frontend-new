import axios from "axios";
const api = axios.create({
  baseURL: "https://api.chomnenhapp.com/api", // Replace with your API URL
});

export default api;
