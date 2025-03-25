import axios from "axios";

export default axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

export const axiosPrivate = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
