import axios from "axios";
import baseUrl from "./baseUrl";
const api = axios.create({
<<<<<<< HEAD
  baseURL: baseUrl + '/api', // Replace with your API URL
=======
  baseURL: "https://api.chomnenhapp.com/api", // Replace with your API URL
>>>>>>> 9505cd1e90c9eee4c6916e19339f8d4e66d0f090
});

export default api;
