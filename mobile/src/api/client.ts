import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const PRODUCTION_API_URL =
  'https://project-management-system-ijm1.onrender.com/api';

const LOCAL_API_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

export const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL || LOCAL_API_URL;

export let API_BASE_URL = DEFAULT_API_URL;

export const setApiBaseUrl = (url: string) => {
  const normalizedUrl = url.trim().replace(/\/+$/, '');
  API_BASE_URL = normalizedUrl;
  api.defaults.baseURL = normalizedUrl;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let sessionExpiredHandler: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: () => void) => {
  sessionExpiredHandler = handler;
};

// Request interceptor: attach token securely from Expo SecureStore
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('pms_jwt_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Could not read token from SecureStore', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle network errors and token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Requirement 9: No network handling
    if (!error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      error.customMessage = 'No internet connection. Please check your network and try again.';
      return Promise.reject(error);
    }

    // Requirement 8: Expired token handling
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        await SecureStore.deleteItemAsync('pms_jwt_token').catch(() => {});
        await SecureStore.deleteItemAsync('pms_user_profile').catch(() => {});
        if (sessionExpiredHandler) {
          sessionExpiredHandler();
        }
      }
    }

    return Promise.reject(error);
  }
);
