import { createSlice } from '@reduxjs/toolkit';
import { sendOtp, verifyOtp } from '../thunks/authThunk';
import { getToken, setToken, clearToken } from '../../lib/tokenStorage';

const safeParse = (key) => {
  try {
    const v = localStorage.getItem(key);
    if (!v || v === 'undefined') return null;
    return JSON.parse(v);
  } catch { return null; }
};

const rawToken = localStorage.getItem('token');
const validToken = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : null;

const initialState = {
  token: validToken,
  user: safeParse('user'),
  isAuthenticated: !!validToken,
  loading: false,
  error: null,
  otpSent: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.otpSent = false;
      clearToken();
      localStorage.removeItem('user');
    },
    clearAuthState: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendOtp.fulfilled, (state) => { state.loading = false; state.otpSent = true; })
      .addCase(sendOtp.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to send OTP'; })
      .addCase(verifyOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        const isDemo = user?.mobile === '8888888888';
        state.loading = false;
        state.token = token;
        state.user = user;
        state.isAuthenticated = true;
        state.otpSent = false;
        setToken(token);
        localStorage.setItem('user', JSON.stringify(user ?? null));
        localStorage.setItem('demoMode', String(isDemo));
      })
      .addCase(verifyOtp.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'OTP verification failed'; });
  },
});

export const { logout, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
