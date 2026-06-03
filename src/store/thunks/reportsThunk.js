import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchReports = createAsyncThunk(
  'reports/fetchPurchases',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/procurement/getPurchases');
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load reports');
    }
  }
);

export const fetchFarmers = createAsyncThunk(
  'reports/fetchFarmers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/user/getAllUsers');
      return res.data?.data?.users || res.data?.data || res.data?.users || [];
    } catch {
      try {
        const fallbackRes = await api.get('/user/getAllFarmers');
        return fallbackRes.data?.data || [];
      } catch {
        return rejectWithValue('Failed to fetch farmers');
      }
    }
  }
);

export const fetchPrivateFiles = createAsyncThunk(
  'reports/fetchPrivateFiles',
  async ({ farmerId, type }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/admin/files/private?type=${type}&userId=${farmerId}`);
      return { farmerId, type, files: res.data.files || [] };
    } catch {
      return rejectWithValue('Failed to fetch files');
    }
  }
);
