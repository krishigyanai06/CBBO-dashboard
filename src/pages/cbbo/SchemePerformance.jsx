import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFarmersPerTenant, getRevenueStats } from '../../store/thunks/cbboThunk';
import { Layers, TrendingUp, Users, AlertCircle, CheckCircle } from 'lucide-react';

const fmtINR = (v) => { const n = Number(v) || 0; if (Math.abs(n) >= 100000) return `₹${(n/100000).toFixed(1)}L`; if (Math.abs(n) >= 1000) return `₹${(n/1000).toFixed(0)}K`; return `₹${n}`; };

export default function SchemePerformance() {
  const dispatch = useDispatch();
  const { farmersPerTenant, farmersPerTenantLoading, revenueStats, revenueLoading } = useSelector((s) => s.cbbo);

  const demoMode = useSelector((s) => s.layout.demoMode);
  useEffect(() => {
    dispatch(getFarmersPerTenant());
    dispatch(getRevenueStats());
  }, [dispatch, demoMode]);

  const isLoading = farmersPerTenantLoading || revenueLoading;
  if (isLoading && !farmersPerTenant) return (
    <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>
  );

  const tenants = Array.isArray(farmersPerTenant) ? farmersPerTenant : (farmersPerTenant?.tenants ?? []);
  const revenuePerTenant = revenueStats?.revenuePerTenant ?? [];
  const totalFarmers = tenants.reduce((s, t) => s + (t.totalFarmers ?? 0), 0);
  const totalSales = revenueStats?.totalSalesRevenueAllTenants ?? 0;
  const totalNet = revenueStats?.totalNetRevenueAllTenants ?? 0;

  // Merge tenants with revenue — derive health status
  const fpoList = tenants.map(t => {
    const rev = revenuePerTenant.find(r => r.tenantId === t.tenantId) ?? {};
    const net = rev.netRevenue ?? 0;
    const sales = rev.salesRevenue ?? 0;
    const health = sales > 0 && net >= 0 ? 'Good' : sales > 0 && net < 0 ? 'At Risk' : 'Inactive';
    return { ...t, ...rev, health };
  });

  const goodCount = fpoList.filter(f => f.health === 'Good').length;
  const atRiskCount = fpoList.filter(f => f.health === 'At Risk').length;
  const inactiveCount = fpoList.filter(f => f.health === 'Inactive').length;

  const healthCfg = {
    Good:     { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500',  icon: CheckCircle },
    'At Risk':{ bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500',  icon: AlertCircle },
    Inactive: { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-500',   dot: 'bg-gray-400',   icon: Layers },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Scheme Performance</h1>
          <p className="text-sm text-gray-500 mt-0.5">FPO health & revenue performance across {tenants.length} tenants</p>
        </div>
        <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">🔒 Read-Only</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total FPOs', value: tenants.length, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Farmers', value: totalFarmers.toLocaleString('en-IN'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Sales', value: fmtINR(totalSales), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Net Revenue', value: fmtINR(totalNet), icon: CheckCircle, color: totalNet >= 0 ? 'text-green-600' : 'text-red-500', bg: totalNet >= 0 ? 'bg-green-50' : 'bg-red-50' },
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

      {/* Health summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Good', count: goodCount, sub: 'Sales revenue & net positive', ...healthCfg.Good },
          { label: 'At Risk', count: atRiskCount, sub: 'Has sales but net negative', ...healthCfg['At Risk'] },
          { label: 'Inactive', count: inactiveCount, sub: 'No sales recorded yet', ...healthCfg.Inactive },
        ].map(({ label, count, sub, bg, border, text, dot, icon: Icon }) => (
          <div key={label} className={`${bg} ${border} border rounded-2xl p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className={`text-sm font-semibold ${text}`}>{label}</span>
            </div>
            <p className={`text-3xl font-bold ${text}`}>{count} <span className="text-sm font-normal">FPOs</span></p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* FPO health table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">FPO Health Overview</h3>
          <p className="text-xs text-gray-400 mt-0.5">Revenue performance & health status per tenant</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4">FPO Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Farmers</th>
                <th className="px-6 py-4">Sales Revenue</th>
                <th className="px-6 py-4">Procurement</th>
                <th className="px-6 py-4">Net Revenue</th>
                <th className="px-6 py-4">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...fpoList]
                .sort((a, b) => {
                  const order = { Good: 0, 'At Risk': 1, Inactive: 2 };
                  return order[a.health] - order[b.health];
                })
                .map(fpo => {
                  const cfg = healthCfg[fpo.health];
                  return (
                    <tr key={fpo.tenantId} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{fpo.tenantName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono rounded-lg">{fpo.tenantCode}</span>
                      </td>
                      <td className="px-6 py-4 text-blue-700 font-medium">{(fpo.totalFarmers ?? 0).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-green-600 font-semibold">{fmtINR(fpo.salesRevenue ?? 0)}</td>
                      <td className="px-6 py-4 text-orange-600 font-semibold">{fmtINR(fpo.procurementExpense ?? 0)}</td>
                      <td className="px-6 py-4 font-bold" style={{ color: (fpo.netRevenue ?? 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                        {fmtINR(fpo.netRevenue ?? 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {fpo.health}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
