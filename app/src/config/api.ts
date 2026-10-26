import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Mặc định: máy ảo Android dùng 10.0.2.2, máy thật hoặc iOS dùng IP mạng Wi-Fi LAN hiện tại
export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:2004/api/v1',
  ios: 'http://localhost:2004/api/v1',
  default: 'http://localhost:2004/api/v1',
});

export const getBaseUrl = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem('custom_api_url');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return DEFAULT_API_URL;
};

export const setBaseUrl = async (url: string) => {
  await AsyncStorage.setItem('custom_api_url', url.trim());
};

export const api = axios.create();

// Interceptor tự động gán BaseURL và Bearer Token trước mỗi request
api.interceptors.request.use(async (config) => {
  const currentBase = await getBaseUrl();
  config.baseURL = currentBase;

  try {
    const token = await AsyncStorage.getItem('accessTokenClient');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});
