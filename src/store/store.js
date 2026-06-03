import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import layoutReducer from './slices/layoutSlice';
import broadcastReducer from './slices/broadcastSlice';
import reportsReducer from './slices/reportsSlice';
import cbboReducer from './slices/cbboSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    layout: layoutReducer,
    broadcast: broadcastReducer,
    reports: reportsReducer,
    cbbo: cbboReducer,
  },
});
