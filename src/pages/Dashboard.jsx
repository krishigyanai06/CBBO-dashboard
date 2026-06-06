import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  Users,
  IndianRupee,
  TrendingUp,
  Download,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { getCbboGlobalData } from "../store/thunks/cbboThunk";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  SkeletonHeader,
  SkeletonStatCards,
  SkeletonTable,
} from "../components/Skeleton";

const fmtINR = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

const Sparkline = ({ color = "#16a34a" }) => {
  const w = 64,
    h = 28;
  const pts = [8, 14, 6, 18, 10, 22, 5, 16, 20, 12, 24];
  const max = Math.max(...pts),
    min = Math.min(...pts);
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map((p) => h - ((p - min) / (max - min || 1)) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const {
    stats,
    fpos,
    monthlyRevenueTrend,
    farmerGrowthTrend,
    topFpos,
    loading,
    error,
  } = useSelector((s) => s.cbbo);

  const [sortField, setSortField] = useState("salesRevenue");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 8;

  const demoMode = useSelector((s) => s.layout.demoMode);
  useEffect(() => {
    dispatch(getCbboGlobalData());
  }, [dispatch, demoMode]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortOrder]);

  const handleDownload = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CBBO Cluster Performance Report", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 25);
      doc.setTextColor(0);
      autoTable(doc, {
        startY: 32,
        head: [["Metric", "Value"]],
        body: [
          ["Total FPOs", String(stats.totalFpos ?? 0)],
          ["Total Farmers", String(stats.totalFarmers ?? 0)],
          [
            "Total Sales Revenue",
            `Rs.${(stats.totalSalesRevenue ?? 0).toLocaleString("en-IN")}`,
          ],
          [
            "Total Procurement",
            `Rs.${(stats.totalProcurementExpense ?? 0).toLocaleString("en-IN")}`,
          ],
          [
            "Total Net Revenue",
            `Rs.${(stats.totalNetRevenue ?? 0).toLocaleString("en-IN")}`,
          ],
        ],
        headStyles: { fillColor: [15, 61, 26] },
      });
      const y = doc.lastAutoTable.finalY + 10;
      autoTable(doc, {
        startY: y,
        head: [["FPO Name", "Code", "Farmers", "Sales Revenue", "Net Revenue"]],
        body: fpos.map((f) => [
          f.name,
          f.code,
          String(f.farmers),
          `Rs.${f.salesRevenue.toLocaleString("en-IN")}`,
          `Rs.${f.netRevenue.toLocaleString("en-IN")}`,
        ]),
        headStyles: { fillColor: [15, 61, 26] },
      });
      doc.save(`cbbo-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF failed:", err);
    }
  };

  if (loading)
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <SkeletonStatCards count={4} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonTable rows={4} cols={2} />
          <SkeletonTable rows={4} cols={2} />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="max-w-md p-6 border border-red-200 bg-red-50 rounded-xl">
          <h3 className="mb-2 text-lg font-semibold text-red-800">
            Failed to Load Dashboard
          </h3>
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <button
            onClick={() => dispatch(getCbboGlobalData())}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );

  const toggleSort = (field) => {
    if (sortField === field)
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filtered = [...fpos]
    .filter(
      (f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.code ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const vA = a[sortField] ?? 0,
        vB = b[sortField] ?? 0;
      return sortOrder === "asc" ? (vA > vB ? 1 : -1) : vA < vB ? 1 : -1;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );
  const growthKey = "count";

  const netIsNeg = (stats.totalNetRevenue ?? 0) < 0;

  const KPI_CARDS = [
    {
      title: "Total FPOs",
      value: stats.totalFpos ?? 0,
      icon: Building2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      trend: "Registered Fpos",
      sparkColor: "#10b981",
    },
    {
      title: "Total Farmers",
      value: (stats.totalFarmers ?? 0).toLocaleString("en-IN"),
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: "Across all FPOs",
      sparkColor: "#3b82f6",
    },
    {
      title: "Total Sales Revenue",
      value: fmtINR(stats.totalSalesRevenue ?? 0),
      icon: IndianRupee,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      trend: `Avg ${fmtINR(stats.avgSalesRevenue ?? 0)} / FPO`,
      sparkColor: "#16a34a",
    },
    {
      title: "Total Net Revenue",
      value: fmtINR(stats.totalNetRevenue ?? 0),
      icon: TrendingUp,
      iconBg: netIsNeg ? "bg-red-50" : "bg-emerald-50",
      iconColor: netIsNeg ? "text-red-500" : "text-emerald-600",
      trend: `Procurement: ${fmtINR(stats.totalProcurementExpense ?? 0)}`,
      sparkColor: netIsNeg ? "#ef4444" : "#10b981",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            CBBO Analytics Overview
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Consolidated view across {stats.totalFpos ?? 0} FPOs.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 active:scale-95 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`${s.iconBg} p-2.5 rounded-xl`}>
                    <Icon className={`w-5 h-5 ${s.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      {s.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-800 leading-tight mt-0.5">
                      {s.value}
                    </p>
                  </div>
                </div>
                <Sparkline color={s.sparkColor} />
              </div>
              <p className="text-xs mt-3 font-medium text-gray-400">
                {s.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales vs Procurement per FPO */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 rounded-xl bg-emerald-50">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Sales vs Procurement per FPO
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Revenue breakdown across all tenants
              </p>
            </div>
          </div>
          {monthlyRevenueTrend.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">
              No revenue data from API
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={monthlyRevenueTrend}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtINR}
                />
                <Tooltip
                  formatter={(v, n) => [
                    fmtINR(v),
                    n === "salesRevenue" ? "Sales Revenue" : "Procurement",
                  ]}
                />
                <Legend
                  formatter={(v) =>
                    v === "salesRevenue" ? "Sales Revenue" : "Procurement"
                  }
                />
                <Bar
                  dataKey="salesRevenue"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="procurementExpense"
                  fill="#d4af37"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Farmer Growth Monthwise */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-50">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Farmer Growth (Monthwise)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Monthly farmer enrollment across all FPOs
              </p>
            </div>
          </div>
          {!farmerGrowthTrend || farmerGrowthTrend.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">
              No farmer growth data from API
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={farmerGrowthTrend}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v) => [v.toLocaleString("en-IN"), "Farmers"]}
                />
                <Area
                  type="monotone"
                  dataKey={growthKey}
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  fill="url(#growthGrad)"
                  dot={{
                    r: 4,
                    stroke: "#16a34a",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* FPO Revenue Table */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              FPO Revenue Overview
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {fpos.length} FPOs · Sales, Procurement & Net Revenue
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search FPO or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">FPO Name</th>
                <th className="px-6 py-4">Code</th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-gray-200/50 select-none"
                  onClick={() => toggleSort("farmers")}
                >
                  <div className="flex items-center gap-1">
                    Farmers <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-gray-200/50 select-none"
                  onClick={() => toggleSort("salesRevenue")}
                >
                  <div className="flex items-center gap-1">
                    Sales Revenue <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-gray-200/50 select-none"
                  onClick={() => toggleSort("procurementExpense")}
                >
                  <div className="flex items-center gap-1">
                    Procurement <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-gray-200/50 select-none"
                  onClick={() => toggleSort("netRevenue")}
                >
                  <div className="flex items-center gap-1">
                    Net Revenue <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No FPOs found.
                  </td>
                </tr>
              ) : (
                paginated.map((fpo) => (
                  <tr key={fpo.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {fpo.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono rounded-lg">
                        {fpo.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {fpo.farmers}
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-600">
                      {fmtINR(fpo.salesRevenue)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-orange-600">
                      {fmtINR(fpo.procurementExpense)}
                    </td>
                    <td
                      className="px-6 py-4 font-bold"
                      style={{
                        color: fpo.netRevenue >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {fmtINR(fpo.netRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 text-sm font-bold">
                <td className="px-6 py-4 text-gray-700">Total</td>
                <td className="px-6 py-4" />
                <td className="px-6 py-4 text-gray-700">
                  {(stats.totalFarmers ?? 0).toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-green-700">
                  {fmtINR(stats.totalSalesRevenue ?? 0)}
                </td>
                <td className="px-6 py-4 text-orange-700">
                  {fmtINR(stats.totalProcurementExpense ?? 0)}
                </td>
                <td
                  className="px-6 py-4"
                  style={{
                    color:
                      (stats.totalNetRevenue ?? 0) >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {fmtINR(stats.totalNetRevenue ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing {(currentPage - 1) * PER_PAGE + 1}–
              {Math.min(currentPage * PER_PAGE, filtered.length)} of{" "}
              {filtered.length} FPOs
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
