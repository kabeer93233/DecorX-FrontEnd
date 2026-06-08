import axios from "axios";

const custom_axios = axios.create({

  baseURL: import.meta.env.VITE_BASE_URL,

  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },

  timeout: 15000,
});


// REQUEST INTERCEPTOR

custom_axios.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem(
        "access_token",
      );

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
);


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

        const refreshToken =
          localStorage.getItem(
            "refresh_token"
          );

        const response =
          await axios.post(

            `${import.meta.env.VITE_BASE_URL}/auth/refresh`,

            {
              refreshToken,
            },
          );

        const newAccessToken =
          response.data.access_token;

        const newRefreshToken =
          response.data.refresh_token;

        localStorage.setItem(
          "access_token",
          newAccessToken,
        );

        localStorage.setItem(
          "refresh_token",
          newRefreshToken,
        );

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        isRefreshing = false;

        return custom_axios(
          originalRequest,
        );

      } catch (refreshError) {

        isRefreshing = false;

        localStorage.clear();

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