import axios from 'axios';
import { API_ROOT, getApiRoot } from '~/utils/constants';

export const axiosClient = axios.create({
  baseURL: `${API_ROOT}/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    config.baseURL = `${getApiRoot()}/v1`;
    const token = localStorage.getItem('accessTokenClient');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu gặp 404 do người dùng/tài khoản không tồn tại trong DB -> tự động dọn session và chuyển hướng đăng nhập
    const isUserNotFound =
      error.response?.status === 404 &&
      typeof error.response?.data?.message === 'string' &&
      (error.response.data.message.toLowerCase().includes('người dùng') ||
        error.response.data.message.toLowerCase().includes('tài khoản') ||
        error.response.data.message.toLowerCase().includes('user'));

    if (isUserNotFound) {
      localStorage.removeItem('accessTokenClient');
      localStorage.removeItem('userInfoClient');
      if (window.location.pathname !== '/sign-in' && window.location.pathname !== '/sign-up') {
        window.location.href = '/sign-in';
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/signInClient') &&
      !originalRequest.url?.includes('/auth/refreshTokenClient')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const apiBase = `${getApiRoot()}/v1`;
        const res = await axios.put(
          `${apiBase}/auth/refreshTokenClient`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = res.data.accessToken;
        localStorage.setItem('accessTokenClient', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessTokenClient');
        localStorage.removeItem('userInfoClient');
        if (window.location.pathname !== '/sign-in' && window.location.pathname !== '/sign-up') {
          window.location.href = '/sign-in';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes('/auth/signInClient')
    ) {
      if (originalRequest.url?.includes('/auth/refreshTokenClient') || originalRequest._retry) {
        localStorage.removeItem('accessTokenClient');
        localStorage.removeItem('userInfoClient');
        if (window.location.pathname !== '/sign-in' && window.location.pathname !== '/sign-up') {
          window.location.href = '/sign-in';
        }
      }
    }

    // Tự động thử lại transparent đối với các request GET đọc dữ liệu khi gặp lỗi mạng / Backend đang cold start
    const isNetworkOrColdStart =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      (error.response?.status >= 502 && error.response?.status <= 504);

    if (
      isNetworkOrColdStart &&
      originalRequest &&
      originalRequest.method?.toLowerCase() === 'get' &&
      (!originalRequest._retryCount || originalRequest._retryCount < 2)
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delayMs = originalRequest._retryCount * 1200;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return axiosClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

