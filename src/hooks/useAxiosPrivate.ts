import { useEffect } from "react";
import { useAuth } from "../contextApi/ContextApi";
import { axiosPrivate } from "../api/api";

export const useAxiosPrivate = () => {
  const { token } = useAuth();

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
    };
  }, [token]);

  return axiosPrivate;
};
