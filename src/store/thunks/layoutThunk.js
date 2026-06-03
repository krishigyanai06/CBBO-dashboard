import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchMe = createAsyncThunk(
  'layout/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/user/getUserDetails');
      return res.data?.data?.user || res.data?.data || res.data?.user || null;
    } catch {
      return rejectWithValue('Failed to fetch user details');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'layout/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.put('/user/update-profile', formData);
      return res.data?.data?.user || res.data?.data || res.data?.user || formData;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update profile');
    }
  }
);
