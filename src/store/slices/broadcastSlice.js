import { createSlice } from '@reduxjs/toolkit';
import {
  sendBroadcast,
  fetchBroadcastHistory,
  fetchBroadcastStats,
  fetchBroadcastById,
  fetchAllBroadcasts,
} from '../thunks/broadcastThunk';

const broadcastSlice = createSlice({
  name: 'broadcast',
  initialState: {
    broadcasts: [],
    currentBroadcast: null,
    stats: null,
    loading: false,
    error: null,
    sending: false,
    sendError: null,
    sendSuccess: false,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSendState: (state) => {
      state.sending = false;
      state.sendError = null;
      state.sendSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send Broadcast
      .addCase(sendBroadcast.pending, (state) => {
        state.sending = true;
        state.sendError = null;
        state.sendSuccess = false;
      })
      .addCase(sendBroadcast.fulfilled, (state, action) => {
        state.sending = false;
        state.sendSuccess = true;
        // Prepend the new broadcast so it appears first in history
        const newItem = action.payload?.data || action.payload?.broadcast || action.payload;
        if (newItem && newItem._id) state.broadcasts.unshift(newItem);
      })
      .addCase(sendBroadcast.rejected, (state, action) => {
        state.sending = false;
        state.sendError = action.payload;
      })

      // Fetch History
      .addCase(fetchBroadcastHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBroadcastHistory.fulfilled, (state, action) => {
        state.loading = false;
        // Handle different response structures
        if (Array.isArray(action.payload)) {
          state.broadcasts = action.payload;
        } else if (action.payload?.data && Array.isArray(action.payload.data)) {
          state.broadcasts = action.payload.data;
        } else if (action.payload?.broadcasts && Array.isArray(action.payload.broadcasts)) {
          state.broadcasts = action.payload.broadcasts;
        } else {
          state.broadcasts = [];
        }
      })
      .addCase(fetchBroadcastHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.broadcasts = [];
      })

      // Fetch Stats
      .addCase(fetchBroadcastStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBroadcastStats.fulfilled, (state, action) => {
        state.loading = false;
        // Handle different response structures
        if (action.payload?.data) {
          state.stats = action.payload.data;
        } else if (action.payload?.stats) {
          state.stats = action.payload.stats;
        } else {
          state.stats = action.payload;
        }
      })
      .addCase(fetchBroadcastStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.stats = null;
      })

      // Fetch by ID
      .addCase(fetchBroadcastById.fulfilled, (state, action) => {
        state.currentBroadcast = action.payload;
      })

      // Fetch All
      .addCase(fetchAllBroadcasts.fulfilled, (state, action) => {
        // Handle different response structures
        if (Array.isArray(action.payload)) {
          state.broadcasts = action.payload;
        } else if (action.payload?.data && Array.isArray(action.payload.data)) {
          state.broadcasts = action.payload.data;
        } else if (action.payload?.broadcasts && Array.isArray(action.payload.broadcasts)) {
          state.broadcasts = action.payload.broadcasts;
        } else {
          state.broadcasts = [];
        }
      });
  },
});

export const { clearError, clearSendState } = broadcastSlice.actions;
export default broadcastSlice.reducer;
