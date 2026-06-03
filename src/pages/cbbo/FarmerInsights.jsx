import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFarmersPerTenant, getFarmerGrowthMonthwise, getFarmersList } from '../../store/thunks/cbboThunk';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Users, TrendingUp, Layers, Building2, Search, Phone, MapPin } from 'lucide-react';

const COLORS = ['#16a34a', '#d4af37', '#15803d', '#b8960c', '#166534', '#f59e0b', '#14532d', '#ca8a04'];
const PER_PAGE = 10;

export default function FarmerInsights() {
  const dispatch = useDispatch();
  const demoMode = useSelector((s) => s.layout.demoMode);
  const {
    farmersPerTenant, farmersPerTenantLoading, farmersPerTenantError,
    farmerGrowth, farmerGrowthLoading,
    farmersList, farmersListLoading,
  } = useSelector((s) => s.cbbo);

  const [selectedTenant, setSelectedTenant] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(getFarmersPerTenant());
    dispatch(getFarmerGrowthMonthwise());
    dispatch(getFarmersList());
  }, [dispatch, demoMode]);

  useEffect(() => {
    dispatch(getFarmersList(selectedTenant || null));
    setPage(1);
  }, [dispatch, selectedTenant, demoMode]);

  useEffect(() => { setPage(1); }, [search]);

  const tenants = Array.isArray(farmersPerTenant) ? farmersPerTenant : (farmersPerTenant?.tenants ?? []);
  const totalFarmers = tenants.reduce((s, t) => s + (t.totalFarmers ?? 0), 0);
  const avgFarmers = tenants.length ? Math.round(totalFarmers / tenants.length) : 0;
  const maxFarmers = tenants.length ? Math.max(...tenants.map(t => t.totalFarmers ?? 0)) : 0;

  const topByFarmers = [...tenants]
    .sort((a, b) => (b.totalFarmers ?? 0) - (a.totalFarmers ?? 0))
    .slice(0, 8)
    .map(t => ({ name: t.tenantName ?? t.tenantCode ?? 'Unknown', farmers: t.totalFarmers ?? 0 }));

  const rawGrowth = farmerGrowth?.totalGrowth ?? (Array.isArray(farmerGrowth) ? farmerGrowth : []);
  const growthData = rawGrowth.map(g => ({
    month: g.monthName ? `${g.monthName} ${g.year}` : (g.formatted ?? g.month ?? ''),
    count: g.count,
  }));

  const filteredFarmers = farmersList.filter(f => {
    const q = search.toLowerCase();
    return `${f.firstName ?? ''} ${f.lastName ?? ''}`.toLowerCase().includes(q) ||
      (f.mobile ?? '').includes(q);
  });
  const totalPages = Math.ceil(filteredFarmers.length / PER_PAGE);
  const paginated = filteredFarmers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (farmersPerTenantLoading && !farmersPerTenant) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
    </div>
  );

  if (farmersPerTenantError) return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{farmersPerTenantError}</div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Farmer Insights</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live farmer data across {tenants.length} FPOs</p>
        </div>
        <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">🔒 Read-Only</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Farmers', value: totalFarmers.toLocaleString('en-IN'), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total FPOs', value: tenants.length, icon: Building2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Avg Farmers / FPO', value: avgFarmers, icon: Layers, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Largest FPO', value: maxFarmers.toLocaleString('en-IN'), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`${bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthwise enrollment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Farmer Growth (Monthwise)</h3>
          <p className="text-xs text-gray-400 mb-4">New farmers enrolled each month across all FPOs</p>
          {farmerGrowthLoading ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
          ) : growthData.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">No growth data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v) => [v.toLocaleString('en-IN'), 'Farmers']} />
                <Area type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2.5} fill="url(#growthGrad)" dot={{ r: 4, stroke: '#16a34a', strokeWidth: 2, fill: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top FPOs by farmer count */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Top FPOs by Farmer Count</h3>
          <p className="text-xs text-gray-400 mb-4">Highest farmer membership in the cluster</p>
          {topByFarmers.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topByFarmers} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v) => [v.toLocaleString('en-IN'), 'Farmers']} />
                <Bar dataKey="farmers" radius={[4, 4, 0, 0]}>
                  {topByFarmers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-FPO Breakdown Table */}
      {tenants.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Farmers Per FPO</h3>
            <p className="text-xs text-gray-400 mt-0.5">{tenants.length} tenants · sorted by farmer count</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Tenant / FPO</th>
                  <th className="px-6 py-4">Farmer Count</th>
                  <th className="px-6 py-4">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...tenants]
                  .sort((a, b) => (b.totalFarmers ?? 0) - (a.totalFarmers ?? 0))
                  .map((t, i) => {
                    const count = t.totalFarmers ?? 0;
                    const share = totalFarmers > 0 ? ((count / totalFarmers) * 100).toFixed(1) : 0;
                    return (
                      <tr key={t.tenantId ?? i} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{t.tenantName}</p>
                          <p className="text-xs text-gray-400 font-mono">{t.tenantCode}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-700">{count.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Farmer Directory — always visible, filter by FPO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Farmer Directory</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedTenant
                ? `${tenants.find(t => t.tenantId === selectedTenant)?.tenantName ?? ''} · ${filteredFarmers.length} farmers`
                : `All FPOs · ${filteredFarmers.length} farmers`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All FPOs</option>
              {tenants.map(t => (
                <option key={t.tenantId} value={t.tenantId}>{t.tenantName}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or mobile..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 bg-white"
              />
            </div>
          </div>
        </div>

        {farmersListLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Farmer Name</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4">Village</th>
                    <th className="px-6 py-4">FPO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        {search || selectedTenant ? 'No farmers match your filter.' : 'No farmer data available.'}
                      </td>
                    </tr>
                  ) : paginated.map((f, i) => (
                    <tr key={f.farmerId ?? f._id ?? i} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 text-gray-400 font-medium">{(page - 1) * PER_PAGE + i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-emerald-700">
                              {(f.firstName ?? '?').charAt(0)}{(f.lastName ?? '').charAt(0)}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-800">{f.firstName} {f.lastName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{f.mobile ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-yellow-500" />
                          <span>{f.village ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg">
                          {f.tenantName ?? f.tenantCode ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredFarmers.length)} of {filteredFarmers.length} farmers
                </span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none">Previous</button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
