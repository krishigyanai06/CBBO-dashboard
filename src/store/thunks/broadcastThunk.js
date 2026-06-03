import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { DEMO_BROADCASTS } from '../../lib/demoData';

// Send Broadcast
export const sendBroadcast = createAsyncThunk(
  'broadcast/send',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/broadcast/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send broadcast');
    }
  }
);

// Fetch Broadcast History
export const fetchBroadcastHistory = createAsyncThunk(
  'broadcast/history',
  async (_, { getState, rejectWithValue }) => {
    if (getState().layout.demoMode) return DEMO_BROADCASTS;
    try {
      const response = await api.get('/broadcast/history');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch broadcast history');
    }
  }
);

// Fetch Broadcast Stats
export const fetchBroadcastStats = createAsyncThunk(
  'broadcast/stats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/broadcast/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

// Fetch Broadcast by ID
export const fetchBroadcastById = createAsyncThunk(
  'broadcast/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/broadcast/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch broadcast');
    }
  }
);

// Fetch All Broadcasts
export const fetchAllBroadcasts = createAsyncThunk(
  'broadcast/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/broadcast/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch broadcasts');
    }
  }
);
