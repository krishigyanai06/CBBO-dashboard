import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFarmersPerTenant, getRevenueStats, getFarmerGrowthMonthwise } from '../store/thunks/cbboThunk';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Download, TrendingUp, Users, Building2, IndianRupee } from 'lucide-react';
import { SkeletonStatCards, SkeletonTable } from '../components/Skeleton';

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#0891b2'];
const fmtINR = (v) => { const n = Number(v) || 0; if (Math.abs(n) >= 100000) return `₹${(n/100000).toFixed(1)}L`; if (Math.abs(n) >= 1000) return `₹${(n/1000).toFixed(0)}K`; return `₹${n}`; };

export default function Reports() {
  const dispatch = useDispatch();
  const {
    farmersPerTenant, farmersPerTenantLoading,
    revenueStats, revenueLoading,
    farmerGrowth,
  } = useSelector((s) => s.cbbo);

  const demoMode = useSelector((s) => s.layout.demoMode);
  useEffect(() => {
    dispatch(getFarmersPerTenant());
    dispatch(getRevenueStats());
    dispatch(getFarmerGrowthMonthwise());
  }, [dispatch, demoMode]);

  const isLoading = farmersPerTenantLoading || revenueLoading;
  if (isLoading && !farmersPerTenant) return (
    <div className="space-y-6"><SkeletonStatCards count={4} /><SkeletonTable rows={5} cols={5} /></div>
  );

  const tenants = Array.isArray(farmersPerTenant) ? farmersPerTenant : (farmersPerTenant?.tenants ?? []);
  const revenuePerTenant = revenueStats?.revenuePerTenant ?? [];
  const totalFarmers = tenants.reduce((s, t) => s + (t.totalFarmers ?? 0), 0);
  const totalSales = revenueStats?.totalSalesRevenueAllTenants ?? 0;
  const totalProcurement = revenueStats?.totalProcurementExpenseAllTenants ?? 0;
  const totalNet = revenueStats?.totalNetRevenueAllTenants ?? 0;
  const avgSales = revenueStats?.averageSalesRevenue ?? 0;

  // Merge tenants + revenue for table
  const fpoList = tenants.map(t => {
    const rev = revenuePerTenant.find(r => r.tenantId === t.tenantId) ?? {};
    return { ...t, ...rev };
  });

  // Chart: sales revenue per FPO
  const revenueChartData = revenuePerTenant.map(r => ({
    name: r.tenantName,
    salesRevenue: r.salesRevenue,
    procurementExpense: r.procurementExpense,
  }));

  // Farmer growth
  const rawGrowth = farmerGrowth?.totalGrowth ?? [];
  const tenantWiseGrowth = farmerGrowth?.tenantWiseGrowth ?? [];

  const handleDownload = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();

      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('CBBO Full Cluster Report', 14, 18);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 25);
      doc.setTextColor(0);

      // Summary
      autoTable(doc, {
        startY: 32,
        head: [['Metric', 'Value']],
        body: [
          ['Total FPOs', String(tenants.length)],
          ['Total Farmers', String(totalFarmers)],
          ['Total Sales Revenue', `Rs.${totalSales.toLocaleString('en-IN')}`],
          ['Total Procurement', `Rs.${totalProcurement.toLocaleString('en-IN')}`],
          ['Total Net Revenue', `Rs.${totalNet.toLocaleString('en-IN')}`],
          ['Avg Sales / FPO', `Rs.${avgSales.toLocaleString('en-IN')}`],
        ],
        headStyles: { fillColor: [15, 61, 26] },
      });

      // Revenue per FPO
      const y1 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Revenue Breakdown per FPO', 14, y1);
      autoTable(doc, {
        startY: y1 + 4,
        head: [['FPO Name', 'Code', 'Farmers', 'Sales Revenue', 'Procurement', 'Net Revenue']],
        body: fpoList.map(f => [
          f.tenantName, f.tenantCode, String(f.totalFarmers ?? 0),
          `Rs.${(f.salesRevenue ?? 0).toLocaleString('en-IN')}`,
          `Rs.${(f.procurementExpense ?? 0).toLocaleString('en-IN')}`,
          `Rs.${(f.netRevenue ?? 0).toLocaleString('en-IN')}`,
        ]),
        headStyles: { fillColor: [15, 61, 26] },
        styles: { fontSize: 8 },
      });

      // Farmer growth
      if (rawGrowth.length > 0) {
        const y2 = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text('Farmer Growth (Monthwise)', 14, y2);
        autoTable(doc, {
          startY: y2 + 4,
          head: [['Month', 'Total Farmers Enrolled']],
          body: rawGrowth.map(g => [`${g.monthName} ${g.year}`, String(g.count)]),
          headStyles: { fillColor: [15, 61, 26] },
        });
      }

      doc.save(`cbbo-full-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">CBBO cluster reports — exportable as PDF</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">🔒 Read-Only</span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 transition shadow-sm"
          >
            <Download className="w-4 h-4" />Export PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total FPOs', value: tenants.length, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Farmers', value: totalFarmers.toLocaleString('en-IN'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Sales Revenue', value: fmtINR(totalSales), icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Net Revenue', value: fmtINR(totalNet), icon: TrendingUp, color: totalNet >= 0 ? 'text-emerald-600' : 'text-red-500', bg: totalNet >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
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

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-1">Sales vs Procurement per FPO</h3>
        <p className="text-xs text-gray-400 mb-4">Revenue breakdown across all tenants</p>
        {revenueChartData.length === 0
          ? <p className="text-sm text-gray-400 py-10 text-center">No revenue data from API</p>
          : <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtINR} />
              <Tooltip formatter={(v, n) => [fmtINR(v), n === 'salesRevenue' ? 'Sales Revenue' : 'Procurement']} />
              <Bar dataKey="salesRevenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="procurementExpense" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        }
      </div>

      {/* Farmer growth per tenant */}
      {tenantWiseGrowth.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Farmer Enrollment per FPO</h3>
          <p className="text-xs text-gray-400 mb-4">Farmers enrolled this month per tenant</p>
          <div className="space-y-3">
            {tenantWiseGrowth.map((t, i) => {
              const latest = t.growth?.[t.growth.length - 1]?.count ?? 0;
              const share = totalFarmers > 0 ? ((latest / totalFarmers) * 100).toFixed(1) : 0;
              return (
                <div key={t.tenantId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-gray-700">{t.tenantName}</span>
                      <span className="text-xs text-gray-400 font-mono">{t.tenantCode}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{latest} farmers</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${share}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{share}% of total</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full FPO table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Complete FPO Report</h3>
            <p className="text-xs text-gray-400 mt-0.5">{fpoList.length} FPOs · Sales, procurement & net revenue</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">FPO Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Farmers</th>
                <th className="px-6 py-4">Sales Revenue</th>
                <th className="px-6 py-4">Procurement</th>
                <th className="px-6 py-4">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fpoList.map((fpo, i) => (
                <tr key={fpo.tenantId} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-6 py-3 font-semibold text-gray-800">{fpo.tenantName}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono rounded-lg">{fpo.tenantCode}</span>
                  </td>
                  <td className="px-6 py-3 font-medium text-blue-700">{(fpo.totalFarmers ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3 font-semibold text-green-600">{fmtINR(fpo.salesRevenue ?? 0)}</td>
                  <td className="px-6 py-3 font-semibold text-orange-600">{fmtINR(fpo.procurementExpense ?? 0)}</td>
                  <td className="px-6 py-3 font-bold" style={{ color: (fpo.netRevenue ?? 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    {fmtINR(fpo.netRevenue ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-sm">
                <td className="px-6 py-4 text-gray-700" colSpan={3}>Total</td>
                <td className="px-6 py-4 text-blue-700">{totalFarmers.toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 text-green-700">{fmtINR(totalSales)}</td>
                <td className="px-6 py-4 text-orange-700">{fmtINR(totalProcurement)}</td>
                <td className="px-6 py-4 font-bold" style={{ color: totalNet >= 0 ? '#16a34a' : '#dc2626' }}>{fmtINR(totalNet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
