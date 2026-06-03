const KEY = 'token';

export const getToken = () => {
  const token = localStorage.getItem(KEY);
  if (!token || token === 'undefined' || token === 'null') return null;
  return token;
};

export const setToken = (token) => {
  if (!token || typeof token !== 'string' || token.trim() === '') return;
  localStorage.setItem(KEY, token);
  sessionStorage.setItem(KEY, token); // keep both in sync
};

export const clearToken = () => {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
};

export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
};

export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch { return null; }
};
