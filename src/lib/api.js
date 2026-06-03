import axios from 'axios';
import theme from '../config/theme';
import { getToken } from './tokenStorage';

const api = axios.create({ baseURL: theme.apiBase });

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force logout on 401 if it's a real backend token, not mock
    if (error.response?.status === 401) {
      const token = getToken();
      const isMock = token && token.includes('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      if (!isMock) {
        import('../store/store').then(({ store }) => {
          store.dispatch({ type: 'auth/logout' });
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
