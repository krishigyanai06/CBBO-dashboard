import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFarmersPerTenant, getRevenueStats, getFarmerGrowthMonthwise } from '../store/thunks/cbboThunk';
import { DEMO_FARMERS_PER_TENANT, DEMO_REVENUE, DEMO_FARMER_GROWTH } from './demoData';

/**
 * Single hook used by all CBBO pages.
 * Returns the same shape regardless of demo/live mode.
 */
export function useCbboData({ revenue = false, growth = false } = {}) {
  const dispatch = useDispatch();
  const demoMode = useSelector((s) => s.layout.demoMode);
  const {
    farmersPerTenant, farmersPerTenantLoading,
    revenueStats, revenueLoading,
    farmerGrowth, farmerGrowthLoading,
  } = useSelector((s) => s.cbbo);

  useEffect(() => {
    if (demoMode) return; // skip API calls in demo mode
    dispatch(getFarmersPerTenant());
    if (revenue) dispatch(getRevenueStats());
    if (growth)  dispatch(getFarmerGrowthMonthwise());
  }, [demoMode, dispatch, revenue, growth]);

  if (demoMode) {
    return {
      demoMode: true,
      loading: false,
      farmersPerTenant: DEMO_FARMERS_PER_TENANT,
      revenueStats:     DEMO_REVENUE,
      farmerGrowth:     DEMO_FARMER_GROWTH,
    };
  }

  return {
    demoMode: false,
    loading: farmersPerTenantLoading || (revenue && revenueLoading) || (growth && farmerGrowthLoading),
    farmersPerTenant,
    revenueStats,
    farmerGrowth,
  };
}

/** Fetch revenue for a specific tenant (respects demo mode) */
export function useTenantRevenue(tenantId) {
  const dispatch = useDispatch();
  const demoMode = useSelector((s) => s.layout.demoMode);
  const { revenueStats, revenueLoading } = useSelector((s) => s.cbbo);

  useEffect(() => {
    if (demoMode) return;
    dispatch(getRevenueStats(tenantId || null));
  }, [demoMode, dispatch, tenantId]);

  if (demoMode) {
    // filter demo revenue to selected tenant if provided
    if (tenantId) {
      const tenantRev = DEMO_REVENUE.revenuePerTenant.find(r => r.tenantId === tenantId);
      return {
        revenueStats: tenantRev ? {
          ...DEMO_REVENUE,
          revenuePerTenant: [tenantRev],
          totalSalesRevenueAllTenants: tenantRev.salesRevenue,
          totalProcurementExpenseAllTenants: tenantRev.procurementExpense,
          totalNetRevenueAllTenants: tenantRev.netRevenue,
        } : DEMO_REVENUE,
        revenueLoading: false,
      };
    }
    return { revenueStats: DEMO_REVENUE, revenueLoading: false };
  }

  return { revenueStats, revenueLoading };
}
