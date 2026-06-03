import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFarmersPerTenant, getRevenueStats } from '../../store/thunks/cbboThunk';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { Building2, Search, ArrowUpDown, TrendingUp, Users, X, IndianRupee } from 'lucide-react';

const COLORS = [
  '#16a34a', // green-600
  '#d4af37', // gold
  '#15803d', // green-700
  '#b8860b', // dark-goldenrod
  '#22c55e', // green-500
  '#f59e0b', // amber-400
  '#166534', // green-800
  '#ca8a04', // yellow-600
  '#4ade80', // green-400
  '#fbbf24', // amber-300
  '#14532d', // green-900
  '#d97706', // amber-600
  '#86efac', // green-300
  '#a16207', // yellow-700
  '#bbf7d0', // green-200
];
const DEMO_SHARE = [
  { name: 'Nagar FPO Hanumangarh', value: 11.2 },
  { name: 'Marwar Kisan Samridhi FPO', value: 10.6 },
  { name: 'Mewar Krishi Vikas FPO', value: 9.8 },
  { name: 'Shekhawati Agri Producer', value: 9.0 },
  { name: 'Brij Kisan Utpadak Sangh', value: 8.3 },
  { name: 'Bikaner Dryland FPO', value: 6.8 },
  { name: 'Aravalli Green Producers', value: 6.2 },
  { name: 'Chambal Valley FPO', value: 7.5 },
  { name: 'Hadoti Farmers Collective', value: 6.0 },
  { name: 'Dhundhar Kisan Producer Co.', value: 5.4 },
  { name: 'Malani Seed Farmers FPO', value: 4.8 },
  { name: 'Godwar Agri Collective', value: 4.6 },
  { name: 'Thar Organic Producers', value: 3.9 },
  { name: 'Vagad Tribal Farmers FPO', value: 3.3 },
  { name: 'Mewat Agri Producer Society', value: 2.6 },
];
const fmtINR = (v) => { const n = Number(v) || 0; if (Math.abs(n) >= 100000) return `₹${(n/100000).toFixed(1)}L`; if (Math.abs(n) >= 1000) return `₹${(n/1000).toFixed(0)}K`; return `₹${n}`; };

export default function FpoAnalytics() {
  const dispatch = useDispatch();
  const { farmersPerTenant, farmersPerTenantLoading, revenueStats, revenueLoading } = useSelector((s) => s.cbbo);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('farmers');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [selectedFpo, setSelectedFpo] = useState(null);
  const PER_PAGE = 10;

  const demoMode = useSelector((s) => s.layout.demoMode);
  useEffect(() => {
    dispatch(getFarmersPerTenant());
    dispatch(getRevenueStats());
  }, [dispatch, demoMode]);
  useEffect(() => { setPage(1); }, [search, sortField]);

  const handleViewRevenue = (fpo) => {
    setSelectedFpo(fpo);
    dispatch(getRevenueStats(fpo.tenantId));
  };

  if (farmersPerTenantLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>;

  const tenants = Array.isArray(farmersPerTenant) ? farmersPerTenant : (farmersPerTenant?.tenants ?? []);
  const totalFarmers = tenants.reduce((s, t) => s + (t.totalFarmers ?? 0), 0);
  const totalFpos = tenants.length;
  const avgFarmers = totalFpos ? Math.round(totalFarmers / totalFpos) : 0;

  // Build top-10 by salesRevenue from global revenueStats
  const revenuePerTenant = revenueStats?.revenuePerTenant ?? [];
  const top10 = [...revenuePerTenant]
    .sort((a, b) => (b.salesRevenue ?? 0) - (a.salesRevenue ?? 0))
    .slice(0, 10)
    .map(r => ({ name: r.tenantName, salesRevenue: r.salesRevenue, procurementExpense: r.procurementExpense, netRevenue: r.netRevenue }));

  // Sales share donut data
  const donutData = revenuePerTenant
    .filter(r => (r.salesRevenue ?? 0) > 0)
    .map(r => ({ name: r.tenantName, value: r.salesRevenue }));

  const toggleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  const filtered = [...tenants]
    .filter(t => {
      const q = search.toLowerCase();
      return (t.tenantName ?? '').toLowerCase().includes(q) || (t.tenantCode ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let vA = a[sortField === 'farmers' ? 'totalFarmers' : sortField] ?? 0;
      let vB = b[sortField === 'farmers' ? 'totalFarmers' : sortField] ?? 0;
      return sortOrder === 'asc' ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">FPO Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Read-only analytics across {totalFpos} FPOs in the CBBO cluster</p>
        </div>
        <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">🔒 Read-Only</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total FPOs', value: totalFpos, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Farmers', value: totalFarmers.toLocaleString('en-IN'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Farmers / FPO', value: avgFarmers, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
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

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top FPOs by Sales Revenue — horizontal bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2 rounded-xl bg-amber-50"><IndianRupee className="w-4 h-4 text-amber-600" /></div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Top FPOs by Sales Revenue</h3>
              <p className="text-xs text-gray-400">Ranked by sales · all tenants</p>
            </div>
          </div>
          {top10.length === 0
            ? <p className="text-sm text-gray-400 py-10 text-center">No revenue data from API</p>
            : <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtINR} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-xs">
                        <p className="font-semibold text-gray-800 mb-1">{d.name}</p>
                        <p className="text-green-600">Sales: {fmtINR(d.salesRevenue)}</p>
                        <p className="text-orange-500">Procurement: {fmtINR(d.procurementExpense)}</p>
                        <p className={d.netRevenue >= 0 ? 'text-emerald-600' : 'text-red-500'}>Net: {fmtINR(d.netRevenue)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="salesRevenue" radius={[0, 6, 6, 0]} maxBarSize={14}>
                  {top10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          }
        </div>

        {/* Sales Revenue Share — premium donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2 rounded-xl bg-emerald-50"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Sales Revenue Share</h3>
              <p className="text-xs text-gray-400">% contribution per FPO to total sales</p>
            </div>
          </div>
          {(() => {
            const isLive = donutData.length > 0 && (revenueStats?.totalSalesRevenueAllTenants ?? 0) > 0;
            const shareData = isLive
              ? donutData.map(d => ({ name: d.name, value: +((d.value / revenueStats.totalSalesRevenueAllTenants) * 100).toFixed(1) }))
              : DEMO_SHARE;
            const totalLabel = isLive ? fmtINR(revenueStats.totalSalesRevenueAllTenants) : 'Demo';
            const pieData = shareData.map(d => ({ ...d }));
            return (
              <div className="flex flex-col gap-4">
                {/* Donut */}
                <div className="flex justify-center">
                  <div className="relative w-[180px] h-[180px]">
                    <PieChart width={180} height={180}>
                      <defs>
                        {shareData.map((_, i) => (
                          <linearGradient key={i} id={`sg${i}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} />
                            <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.65} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        cx={90} cy={90}
                        innerRadius={54} outerRadius={80}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {pieData.map((_, i) => <Cell key={i} fill={`url(#sg${i})`} />)}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-3 py-2 text-xs">
                              <p className="font-semibold text-gray-800 max-w-[160px] leading-tight">{d.name}</p>
                              <p className="text-emerald-600 font-bold mt-0.5">{d.value}%</p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-gray-400 font-medium">Total</span>
                      <span className="text-sm font-bold text-gray-800 leading-tight">{totalLabel}</span>
                      {!isLive && <span className="text-[9px] text-amber-500 font-semibold mt-0.5">Preview</span>}
                    </div>
                  </div>
                </div>
                {/* Legend bars — scrollable */}
                <div className="overflow-y-auto max-h-[200px] pr-1 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {shareData.map((d, i) => (
                    <div key={d.name} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[11px] text-gray-600 font-medium truncate leading-tight">{d.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-800 ml-2 flex-shrink-0">{d.value}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${(d.value / Math.max(...shareData.map(x => x.value))) * 100}%`,
                            background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}99)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h3 className="font-bold text-gray-800">All FPOs in Cluster</h3>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} results</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">FPO Name</th>
                <th className="px-6 py-4">Tenant Code</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 select-none" onClick={() => toggleSort('farmers')}>
                  <div className="flex items-center gap-1">Farmers <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4">District</th>
                <th className="px-6 py-4">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No FPOs found.</td></tr>
              ) : paginated.map((t, idx) => (
                <tr key={t.tenantId} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 text-gray-400 font-medium">{(page - 1) * PER_PAGE + idx + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{t.tenantName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono rounded-lg">{t.tenantCode}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-blue-700">{(t.totalFarmers ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">{t.district ?? '—'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewRevenue(t)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      View Revenue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none">Previous</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Detail Panel */}
      {selectedFpo && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-800">{selectedFpo.tenantName} — Revenue Stats</h3>
              <p className="text-xs text-gray-400 mt-0.5">tenantId: <span className="font-mono text-gray-500">{selectedFpo.tenantId}</span></p>
            </div>
            <button onClick={() => setSelectedFpo(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {revenueLoading ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 animate-pulse">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Fetching revenue data…
            </div>
          ) : revenueStats ? (() => {
            // find the specific tenant's revenue from revenuePerTenant
            const tenantRev = revenueStats.revenuePerTenant?.find(r => r.tenantId === selectedFpo.tenantId) ?? revenueStats;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Sales Revenue', value: fmtINR(tenantRev.salesRevenue ?? 0), color: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Procurement Expense', value: fmtINR(tenantRev.procurementExpense ?? 0), color: 'text-orange-700', bg: 'bg-orange-50' },
                  { label: 'Net Revenue', value: fmtINR(tenantRev.netRevenue ?? 0), color: (tenantRev.netRevenue ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600', bg: (tenantRev.netRevenue ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-4`}>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            );
          })() : (
            <p className="text-sm text-gray-400">No revenue data returned from API.</p>
          )}
        </div>
      )}
    </div>
  );
}
