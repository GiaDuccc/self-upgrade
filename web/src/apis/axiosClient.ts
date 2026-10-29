import axios from 'axios';
import { API_ROOT, getApiRoot } from '~/utils/constants';

export const axiosClient = axios.create({
  baseURL: `${API_ROOT}/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const isTransientNetworkError = (err: any): boolean => {
  const status = err?.response?.status;
  return (
    !err?.response ||
    err?.code === 'ERR_NETWORK' ||
    err?.code === 'ECONNABORTED' ||
    (typeof status === 'number' && status >= 500 && status <= 504) ||
    status === 429
  );
};

/**
 * Tự động xin cấp lại accessTokenClient từ cookie refreshTokenClient.
 * Hỗ trợ hàng đợi (deduplicate concurrent calls) và tự động retry khi BE đang khởi động / reload.
 */
export const tryRefreshTokenClient = async (maxRetries = 2): Promise<string> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    let attempt = 0;
    while (true) {
      try {
        const apiBase = `${getApiRoot()}/v1`;
        const res = await axios.put(
          `${apiBase}/auth/refreshTokenClient`,
          {},
          { withCredentials: true, timeout: 10000 }
        );
        const newAccessToken = res.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('Missing accessToken in refresh response');
        }

        localStorage.setItem('accessTokenClient', newAccessToken);
        if (res.data?.user) {
          localStorage.setItem('userInfoClient', JSON.stringify(res.data.user));
        }

        processQueue(null, newAccessToken);
        return newAccessToken;
      } catch (err: any) {
        if (isTransientNetworkError(err) && attempt < maxRetries) {
          attempt += 1;
          await new Promise((r) => setTimeout(r, attempt * 1500));
          continue;
        }
        throw err;
      }
    }
  } catch (refreshError: any) {
    processQueue(refreshError, null);
    const status = refreshError?.response?.status;
    // Chỉ xóa thông tin đăng nhập khi Backend xác nhận Refresh Token không hợp lệ / đã hết hạn (401/403)
    if (status === 401 || status === 403) {
      localStorage.removeItem('accessTokenClient');
      localStorage.removeItem('userInfoClient');
    }
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

axiosClient.interceptors.request.use(
  async (config) => {
    config.baseURL = `${getApiRoot()}/v1`;
    let token = localStorage.getItem('accessTokenClient');

    const url = config.url || '';
    const isPublicEndpoint =
      url.includes('/status') ||
      url.includes('/auth/signInClient') ||
      url.includes('/auth/signUp') ||
      url.includes('/auth/verifyEmail') ||
      url.includes('/auth/resendVerification') ||
      url.includes('/auth/refreshTokenClient');

    // Nếu mất accessToken trong localStorage nhưng gọi API cần quyền -> chủ động lấy lại từ cookie refreshTokenClient
    if (!token && !isPublicEndpoint) {
      try {
        token = await tryRefreshTokenClient(1);
      } catch {
        // Nếu lỗi mạng hoặc hết hạn, để response interceptor xử lý tiếp
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/signInClient') &&
      !originalRequest.url?.includes('/auth/refreshTokenClient')
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await tryRefreshTokenClient(2);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosClient(originalRequest);
      } catch (refreshError: any) {
        const refreshStatus = refreshError?.response?.status;
        // Chỉ chuyển về trang đăng nhập khi Refresh Token thực sự hết hạn/không hợp lệ (401/403).
        // Nếu lỗi do BE đang khởi động lại (Network Error / 502-504), giữ nguyên trang để tự kết nối lại.
        if (refreshStatus === 401 || refreshStatus === 403) {
          localStorage.removeItem('accessTokenClient');
          localStorage.removeItem('userInfoClient');
          if (window.location.pathname !== '/sign-in' && window.location.pathname !== '/sign-up') {
            window.location.href = '/sign-in';
          }
        }
        return Promise.reject(refreshError);
      }
    } else if (
      error.response?.status === 401 &&
      originalRequest &&
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
    const isNetworkOrColdStart = isTransientNetworkError(error);

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
