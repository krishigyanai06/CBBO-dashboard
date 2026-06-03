import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFarmersPerTenant, getRevenueStats, getFarmerGrowthMonthwise } from '../../store/thunks/cbboThunk';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, IndianRupee, Users, ShoppingCart } from 'lucide-react';

const fmtINR = (v) => { const n = Number(v) || 0; if (Math.abs(n) >= 100000) return `₹${(n/100000).toFixed(1)}L`; if (Math.abs(n) >= 1000) return `₹${(n/1000).toFixed(0)}K`; return `₹${n}`; };
const COLORS = ['#16a34a', '#d4af37', '#15803d', '#b8960c', '#166534', '#f59e0b', '#14532d', '#ca8a04'];

export default function PerformanceAnalytics() {
  const dispatch = useDispatch();
  const {
    farmersPerTenant, farmersPerTenantLoading,
    revenueStats, revenueLoading,
    farmerGrowth, farmerGrowthLoading,
  } = useSelector((s) => s.cbbo);
  const [selectedTenant, setSelectedTenant] = useState('');

  const demoMode = useSelector((s) => s.layout.demoMode);
  useEffect(() => {
    dispatch(getFarmersPerTenant());
    dispatch(getFarmerGrowthMonthwise());
  }, [dispatch, demoMode]);

  useEffect(() => {
    dispatch(getRevenueStats(selectedTenant || null));
  }, [dispatch, selectedTenant, demoMode]);

  const isLoading = farmersPerTenantLoading || farmerGrowthLoading;
  if (isLoading && !farmersPerTenant) return (
    <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>
  );

  // Tenants list for dropdown
  const tenants = Array.isArray(farmersPerTenant) ? farmersPerTenant : (farmersPerTenant?.tenants ?? []);
  const selectedFpoName = tenants.find(t => t.tenantId === selectedTenant)?.tenantName ?? null;
  const totalFarmers = tenants.reduce((s, t) => s + (t.totalFarmers ?? 0), 0);

  // Revenue data from real API — revenuePerTenant array
  const revenuePerTenant = revenueStats?.revenuePerTenant ?? [];
  const totalSales = revenueStats?.totalSalesRevenueAllTenants ?? 0;
  const totalProcurement = revenueStats?.totalProcurementExpenseAllTenants ?? 0;
  const totalNet = revenueStats?.totalNetRevenueAllTenants ?? 0;

  // If a specific tenant is selected, filter to that tenant's revenue
  const selectedRevenue = selectedTenant
    ? revenuePerTenant.find(r => r.tenantId === selectedTenant)
    : null;

  // Chart data: sales vs procurement per tenant
  const revenueChartData = revenuePerTenant.map(r => ({
    name: r.tenantName,
    salesRevenue: r.salesRevenue,
    procurementExpense: r.procurementExpense,
  }));

  // Farmer growth — totalGrowth array
  const rawGrowth = farmerGrowth?.totalGrowth ?? [];
  const growthData = rawGrowth.map(g => ({
    month: `${g.monthName} ${g.year}`,
    count: g.count,
  }));

  // tenantWiseGrowth for per-tenant view
  const tenantWiseGrowth = farmerGrowth?.tenantWiseGrowth ?? [];
  const selectedTenantGrowth = selectedTenant
    ? tenantWiseGrowth.find(t => t.tenantId === selectedTenant)?.growth?.map(g => ({
        month: `${g.monthName} ${g.year}`,
        count: g.count,
      })) ?? []
    : growthData;

  const kpis = selectedRevenue ? [
    { label: 'Sales Revenue', value: fmtINR(selectedRevenue.salesRevenue), icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Procurement', value: fmtINR(selectedRevenue.procurementExpense), icon: ShoppingCart, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Net Revenue', value: fmtINR(selectedRevenue.netRevenue), icon: TrendingUp, color: selectedRevenue.netRevenue >= 0 ? 'text-green-600' : 'text-red-500', bg: selectedRevenue.netRevenue >= 0 ? 'bg-green-50' : 'bg-red-50' },
    { label: 'Farmers', value: (tenants.find(t => t.tenantId === selectedTenant)?.totalFarmers ?? 0).toLocaleString('en-IN'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ] : [
    { label: 'Total Sales', value: fmtINR(totalSales), icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Procurement', value: fmtINR(totalProcurement), icon: ShoppingCart, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Net Revenue', value: fmtINR(totalNet), icon: TrendingUp, color: totalNet >= 0 ? 'text-green-600' : 'text-red-500', bg: totalNet >= 0 ? 'bg-green-50' : 'bg-red-50' },
    { label: 'Total Farmers', value: totalFarmers.toLocaleString('en-IN'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Performance Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedFpoName ? `Viewing: ${selectedFpoName}` : `System-wide across ${tenants.length} FPOs`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTenant}
            onChange={e => setSelectedTenant(e.target.value)}
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[220px]"
          >
            <option value="">All FPOs (Global)</option>
            {tenants.map(t => (
              <option key={t.tenantId} value={t.tenantId}>{t.tenantName} ({t.tenantCode})</option>
            ))}
          </select>
          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">🔒 Read-Only</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`${bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Procurement */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2 rounded-xl bg-emerald-50"><IndianRupee className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Sales vs Procurement</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedFpoName ?? 'All FPOs'} · Revenue breakdown
                {revenueLoading && <span className="ml-2 text-emerald-500 animate-pulse">Loading…</span>}
              </p>
            </div>
          </div>
          {revenueChartData.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No revenue data from API</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={selectedTenant ? revenueChartData.filter(r => r.name === selectedFpoName) : revenueChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                barCategoryGap="35%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtINR} />
                <Tooltip formatter={(v, n) => [fmtINR(v), n === 'salesRevenue' ? 'Sales' : 'Procurement']} />
                <Bar dataKey="salesRevenue" fill="#16a34a" radius={[4, 4, 0, 0]} name="salesRevenue" maxBarSize={40} />
                <Bar dataKey="procurementExpense" fill="#d4af37" radius={[4, 4, 0, 0]} name="procurementExpense" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Farmer Growth */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2 rounded-xl bg-blue-50"><Users className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Farmer Growth (Monthwise)</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedFpoName ?? 'All FPOs'} · Monthly enrollment
                {farmerGrowthLoading && <span className="ml-2 text-blue-500 animate-pulse">Loading…</span>}
              </p>
            </div>
          </div>
          {selectedTenantGrowth.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No growth data from API</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={selectedTenantGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v) => [v.toLocaleString('en-IN'), 'Farmers']} />
                <Area type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2.5} fill="url(#perfGrowthGrad)" dot={{ r: 4, stroke: '#16a34a', strokeWidth: 2, fill: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-tenant revenue breakdown table */}
      {!selectedTenant && revenuePerTenant.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Revenue Breakdown per FPO</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sales, procurement and net revenue across all tenants</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4">FPO</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Sales Revenue</th>
                  <th className="px-6 py-4">Procurement</th>
                  <th className="px-6 py-4">Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {revenuePerTenant.map((r, i) => (
                  <tr key={r.tenantId} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{r.tenantName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono rounded-lg">{r.tenantCode}</span>
                    </td>
                    <td className="px-6 py-4 text-green-600 font-semibold">{fmtINR(r.salesRevenue)}</td>
                    <td className="px-6 py-4 text-orange-600 font-semibold">{fmtINR(r.procurementExpense)}</td>
                    <td className="px-6 py-4 font-bold" style={{ color: r.netRevenue >= 0 ? '#16a34a' : '#dc2626' }}>
                      {fmtINR(r.netRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-sm">
                  <td className="px-6 py-4 text-gray-700" colSpan={2}>Total</td>
                  <td className="px-6 py-4 text-green-700">{fmtINR(totalSales)}</td>
                  <td className="px-6 py-4 text-orange-700">{fmtINR(totalProcurement)}</td>
                  <td className="px-6 py-4 font-bold" style={{ color: totalNet >= 0 ? '#16a34a' : '#dc2626' }}>{fmtINR(totalNet)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
