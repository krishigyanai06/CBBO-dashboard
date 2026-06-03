import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

// ─── MOCK CREDENTIALS (use until backend provides CBBO APIs) ───────────────
// Mobile : 8888888888
// OTP    : any 6 digits  e.g. 123456
// ────────────────────────────────────────────────────────────────────────────
const MOCK_MOBILE = '8888888888';
const MOCK_TOKEN  =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJtb2JpbGUiOiI4ODg4ODg4ODg4Iiwicm9sZSI6ImNiYm8iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async ({ mobile }, { rejectWithValue }) => {
    try {
      if (!mobile) return rejectWithValue('Mobile is required');
      if (mobile === MOCK_MOBILE) return { success: true };
      const res = await api.post('/otp/send-otp', { mobile, role: 'CBBO' });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ mobile, otp }, { rejectWithValue }) => {
    try {
      if (mobile === MOCK_MOBILE) {
        return {
          token: MOCK_TOKEN,
          user: { mobile, role: 'cbbo', firstName: 'CBBO', lastName: 'Officer' },
        };
      }
      const res = await api.post('/otp/verify-otp', { mobile, otp, role: 'CBBO' });
      const token = res.data?.token ?? res.data?.data?.token;
      if (!token) return rejectWithValue('Login failed: no token received');
      const user = res.data?.data?.user ?? res.data?.data ?? res.data?.user ?? { mobile };
      return { token, user };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Invalid OTP');
    }
  }
);
