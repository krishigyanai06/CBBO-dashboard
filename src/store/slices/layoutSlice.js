import { createSlice } from '@reduxjs/toolkit';
import { fetchMe, updateProfile } from '../thunks/layoutThunk';
import { verifyOtp } from '../thunks/authThunk';

const initialState = {
  me: null,
  loading: false,
  saving: false,
  saveError: null,
  error: null,
  demoMode: localStorage.getItem('demoMode') === 'true',
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    clearMe: (state) => { state.me = null; },
    patchMe: (state, action) => { state.me = { ...(state.me || {}), ...action.payload }; },
    toggleDemoMode: (state) => {
      state.demoMode = !state.demoMode;
      localStorage.setItem('demoMode', String(state.demoMode));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMe.fulfilled, (state, action) => { state.loading = false; state.me = action.payload; })
      .addCase(fetchMe.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(updateProfile.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.me = { ...(state.me || {}), ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.demoMode = action.payload.user?.mobile === '8888888888';
      });
  },
});

export const { clearMe, patchMe, toggleDemoMode } = layoutSlice.actions;
export default layoutSlice.reducer;
