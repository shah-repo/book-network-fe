import { useQuery } from "@tanstack/react-query";
import api from "../api/api";

// const fetchData = async (url: string) => {
//   const response = await axios.get(url);
//   return response.data;
// };

const useFetchData = <T>(key: string, token: string, url: string) => {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async () =>
      await api.get(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
      }),
    staleTime: 5000, // 5 seconds caching
    retry: 2, // Retry twice if the request fails
    select: (data: T) => {  // transform data
        return data;
    },
  });
};

export default useFetchData;
