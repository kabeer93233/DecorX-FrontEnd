import axios from "axios";

const custom_axios = axios.create({

  baseURL:
  import.meta.env.VITE_BASE_URL,

  withCredentials: true,

  headers: {

    Accept: "*/*",

    "Content-Type":
    "application/json",
  },

  timeout: 15000,
});

let isRefreshing = false;

custom_axios.interceptors.response.use(

  (response) => response,

  async (error) => {

    const originalRequest =
      error.config;

    if (

      error.response?.status === 401 &&

      !originalRequest._retry &&

      !originalRequest.url?.includes(
        "/auth/refresh"
      )

    ) {

      if (isRefreshing) {

        return Promise.reject(
          error
        );
      }

      originalRequest._retry = true;

      isRefreshing = true;

      try {

        await axios.post(

          `${import.meta.env.VITE_BASE_URL}/auth/refresh`,

          {},

          {
            withCredentials: true,
          },
        );

        isRefreshing = false;

        return custom_axios(
          originalRequest,
        );

      } catch (refreshError) {

        isRefreshing = false;

        localStorage.clear();

        sessionStorage.clear();

        window.location.href =
          "/login";

        return Promise.reject(
          refreshError,
        );
      }
    }

    return Promise.reject(error);
  },
);

export default custom_axios;