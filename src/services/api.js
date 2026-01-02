import axios from "axios";
const api = axios.create({
  baseURL: "http://206.189.155.96/api", // Replace with your API URL
});

export default api;
