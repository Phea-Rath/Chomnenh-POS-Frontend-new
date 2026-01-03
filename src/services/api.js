import axios from "axios";
import baseUrl from "./baseUrl";
const api = axios.create({
  baseURL: baseUrl + '/api', // Replace with your API URL
  baseURL: "https://api.chomnenhapp.com/api", // Replace with your API URL
});

export default api;
