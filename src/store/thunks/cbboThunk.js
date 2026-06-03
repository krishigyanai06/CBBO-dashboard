import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { DEMO_FARMERS_PER_TENANT, DEMO_REVENUE, DEMO_FARMER_GROWTH, DEMO_FARMERS_LIST } from '../../lib/demoData';

const isDemoMode = (getState) => getState().layout.demoMode;

// 1. GET /superadmin/analytics/farmers-per-tenant
export const getFarmersPerTenant = createAsyncThunk(
  'cbbo/getFarmersPerTenant',
  async (_, { getState, rejectWithValue }) => {
    if (isDemoMode(getState)) return DEMO_FARMERS_PER_TENANT;
    try {
      const res = await api.get('/superadmin/analytics/farmers-per-tenant');
      return res.data?.data ?? res.data;
    } catch (err) {
      // Fallback: try cbbo-scoped route
      try {
        const res2 = await api.get('/cbbo/analytics/farmers-per-tenant');
        return res2.data?.data ?? res2.data;
      } catch {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch farmers per tenant');
      }
    }
  }
);

// 2. GET /superadmin/analytics/revenue?tenantId=xxx (tenantId optional)
export const getRevenueStats = createAsyncThunk(
  'cbbo/getRevenueStats',
  async (tenantId = null, { getState, rejectWithValue }) => {
    if (isDemoMode(getState)) {
      if (tenantId) {
        const tenantRev = DEMO_REVENUE.revenuePerTenant.find(r => r.tenantId === tenantId);
        return tenantRev ? {
          ...DEMO_REVENUE,
          revenuePerTenant: [tenantRev],
          totalSalesRevenueAllTenants: tenantRev.salesRevenue,
          totalProcurementExpenseAllTenants: tenantRev.procurementExpense,
          totalNetRevenueAllTenants: tenantRev.netRevenue,
        } : DEMO_REVENUE;
      }
      return DEMO_REVENUE;
    }
    try {
      const params = tenantId ? { tenantId } : {};
      const res = await api.get('/superadmin/analytics/revenue', { params });
      return res.data?.data ?? res.data;
    } catch (err) {
      try {
        const params = tenantId ? { tenantId } : {};
        const res2 = await api.get('/cbbo/analytics/revenue', { params });
        return res2.data?.data ?? res2.data;
      } catch {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch revenue stats');
      }
    }
  }
);

// 3. GET /superadmin/analytics/farmer-growth
export const getFarmerGrowthMonthwise = createAsyncThunk(
  'cbbo/getFarmerGrowthMonthwise',
  async (_, { getState, rejectWithValue }) => {
    if (isDemoMode(getState)) return DEMO_FARMER_GROWTH;
    try {
      const res = await api.get('/superadmin/analytics/farmer-growth');
      return res.data?.data ?? res.data;
    } catch (err) {
      try {
        const res2 = await api.get('/cbbo/analytics/farmer-growth');
        return res2.data?.data ?? res2.data;
      } catch {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch farmer growth');
      }
    }
  }
);

// 4. GET /superadmin/analytics/farmers-list?tenantId=xxx (tenantId optional)
export const getFarmersList = createAsyncThunk(
  'cbbo/getFarmersList',
  async (tenantId = null, { getState, rejectWithValue }) => {
    if (isDemoMode(getState)) {
      return tenantId
        ? DEMO_FARMERS_LIST.filter(f => f.tenantId === tenantId)
        : DEMO_FARMERS_LIST;
    }
    try {
      const params = tenantId ? { tenantId } : {};
      const res = await api.get('/superadmin/analytics/farmers-list', { params });
      return res.data?.data ?? res.data;
    } catch (err) {
      try {
        const params = tenantId ? { tenantId } : {};
        const res2 = await api.get('/cbbo/analytics/farmers-list', { params });
        return res2.data?.data ?? res2.data;
      } catch {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch farmers list');
      }
    }
  }
);

// Dashboard — calls all 3 APIs (respects demo mode via sub-thunks)
export const getCbboGlobalData = createAsyncThunk(
  'cbbo/getCbboGlobalData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const [farmersRes, revenueRes, growthRes] = await Promise.allSettled([
        dispatch(getFarmersPerTenant()),
        dispatch(getRevenueStats()),
        dispatch(getFarmerGrowthMonthwise()),
      ]);

      const farmersData = farmersRes.status === 'fulfilled' ? farmersRes.value.payload : null;
      const revenueData = revenueRes.status === 'fulfilled' ? revenueRes.value.payload : null;
      const growthData  = growthRes.status  === 'fulfilled' ? growthRes.value.payload  : null;

      // Normalise farmersPerTenant → stats + fpos list
      const tenants = Array.isArray(farmersData) ? farmersData : (farmersData?.tenants ?? []);
      const totalFarmers = tenants.reduce((s, t) => s + (t.totalFarmers ?? 0), 0);

      const stats = {
        totalFpos:         tenants.length,
        totalFarmers,
        activeFpos:        tenants.length,
        totalSalesRevenue:       revenueData?.totalSalesRevenueAllTenants ?? 0,
        totalProcurementExpense: revenueData?.totalProcurementExpenseAllTenants ?? 0,
        totalNetRevenue:         revenueData?.totalNetRevenueAllTenants ?? 0,
        avgSalesRevenue:         revenueData?.averageSalesRevenue ?? 0,
        avgProcurementExpense:   revenueData?.averageProcurementExpense ?? 0,
        avgNetRevenue:           revenueData?.averageNetRevenue ?? 0,
      };

      // fpos list — merge farmersPerTenant with revenuePerTenant
      const revenuePerTenant = revenueData?.revenuePerTenant ?? [];
      const fpos = tenants.map(t => {
        const rev = revenuePerTenant.find(r => r.tenantId === t.tenantId) ?? {};
        return {
          id:                  t.tenantId,
          name:                t.tenantName,
          code:                t.tenantCode,
          farmers:             t.totalFarmers ?? 0,
          salesRevenue:        rev.salesRevenue ?? 0,
          procurementExpense:  rev.procurementExpense ?? 0,
          netRevenue:          rev.netRevenue ?? 0,
          status:              (rev.netRevenue ?? 0) >= 0 ? 'Good' : 'Critical',
        };
      });

      // Revenue per tenant (for bar chart on dashboard)
      const monthlyRevenueTrend = revenuePerTenant.map(r => ({
        name: r.tenantName,
        salesRevenue: r.salesRevenue,
        procurementExpense: r.procurementExpense,
        netRevenue: r.netRevenue,
      }));

      // Top 10 FPOs by sales revenue
      const topFpos = [...fpos]
        .sort((a, b) => b.salesRevenue - a.salesRevenue)
        .slice(0, 10)
        .map(f => ({ name: f.name, salesRevenue: f.salesRevenue, netRevenue: f.netRevenue, farmers: f.farmers }));

      // Farmer growth — use totalGrowth array, map formatted as month label
      const rawGrowth = growthData?.totalGrowth ?? [];
      const farmerGrowthTrend = rawGrowth.map(g => ({
        month: g.monthName ? `${g.monthName} ${g.year}` : g.formatted,
        count: g.count,
      }));

      // tenantWiseGrowth — store as-is for per-tenant use
      const tenantWiseGrowth = growthData?.tenantWiseGrowth ?? [];

      return {
        stats,
        fpos,
        monthlyRevenueTrend,
        farmerGrowthTrend,
        tenantWiseGrowth,
        schemeUtilization: [],
        stateWiseDistribution: [],
        topFpos,
        // also populate individual fields used by other pages
        farmersPerTenant: farmersData,
        revenueStats: revenueData,
        farmerGrowth: growthData,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch dashboard data');
    }
  }
);
