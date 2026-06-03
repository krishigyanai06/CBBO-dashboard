import { createSlice } from '@reduxjs/toolkit';
import { getCbboGlobalData, getRevenueStats, getFarmersPerTenant, getFarmerGrowthMonthwise, getFarmersList } from '../thunks/cbboThunk';

const initialState = {
  stats: {
    totalFpos: 0,
    totalFarmers: 0,
    activeFpos: 0,
    avgRevenue: 0,
    schemeUtilization: 0,
  },
  fpos: [],
  monthlyRevenueTrend: [],
  farmerGrowthTrend: [],
  tenantWiseGrowth: [],
  schemeUtilization: [],
  stateWiseDistribution: [],
  topFpos: [],
  revenueStats: null,
  revenueLoading: false,
  revenueError: null,
  farmersPerTenant: null,
  farmersPerTenantLoading: false,
  farmersPerTenantError: null,
  farmerGrowth: null,
  farmerGrowthLoading: false,
  farmerGrowthError: null,
  farmersList: [],
  farmersListLoading: false,
  farmersListError: null,
  loading: false,
  error: null,
};

const cbboSlice = createSlice({
  name: 'cbbo',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCbboGlobalData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCbboGlobalData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.fpos = action.payload.fpos;
        state.monthlyRevenueTrend = action.payload.monthlyRevenueTrend;
        state.farmerGrowthTrend = action.payload.farmerGrowthTrend;
        state.tenantWiseGrowth = action.payload.tenantWiseGrowth ?? [];
        state.schemeUtilization = action.payload.schemeUtilization;
        state.stateWiseDistribution = action.payload.stateWiseDistribution;
        state.topFpos = action.payload.topFpos;
        if (action.payload.farmersPerTenant) state.farmersPerTenant = action.payload.farmersPerTenant;
        if (action.payload.revenueStats)     state.revenueStats     = action.payload.revenueStats;
        if (action.payload.farmerGrowth)     state.farmerGrowth     = action.payload.farmerGrowth;
      })
      .addCase(getCbboGlobalData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load CBBO data';
      })
      .addCase(getRevenueStats.pending, (state) => {
        state.revenueLoading = true;
        state.revenueError = null;
      })
      .addCase(getRevenueStats.fulfilled, (state, action) => {
        state.revenueLoading = false;
        state.revenueStats = action.payload;
      })
      .addCase(getRevenueStats.rejected, (state, action) => {
        state.revenueLoading = false;
        state.revenueError = action.payload || 'Failed to fetch revenue stats';
      })
      .addCase(getFarmersPerTenant.pending, (state) => {
        state.farmersPerTenantLoading = true;
        state.farmersPerTenantError = null;
      })
      .addCase(getFarmersPerTenant.fulfilled, (state, action) => {
        state.farmersPerTenantLoading = false;
        state.farmersPerTenant = action.payload;
      })
      .addCase(getFarmersPerTenant.rejected, (state, action) => {
        state.farmersPerTenantLoading = false;
        state.farmersPerTenantError = action.payload || 'Failed to fetch farmers per tenant';
      })
      .addCase(getFarmerGrowthMonthwise.pending, (state) => {
        state.farmerGrowthLoading = true;
        state.farmerGrowthError = null;
      })
      .addCase(getFarmerGrowthMonthwise.fulfilled, (state, action) => {
        state.farmerGrowthLoading = false;
        state.farmerGrowth = action.payload;
      })
      .addCase(getFarmerGrowthMonthwise.rejected, (state, action) => {
        state.farmerGrowthLoading = false;
        state.farmerGrowthError = action.payload || 'Failed to fetch farmer growth';
      })
      .addCase(getFarmersList.pending, (state) => {
        state.farmersListLoading = true;
        state.farmersListError = null;
      })
      .addCase(getFarmersList.fulfilled, (state, action) => {
        state.farmersListLoading = false;
        state.farmersList = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getFarmersList.rejected, (state, action) => {
        state.farmersListLoading = false;
        state.farmersListError = action.payload || 'Failed to fetch farmers list';
      });
  },
});

export default cbboSlice.reducer;
