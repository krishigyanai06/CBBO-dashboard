import { useEffect, useRef, useState } from 'react';
import {
  RefreshCw, Landmark, Users, Building2, Wallet,
  TrendingUp, TrendingDown, CheckCircle2, Clock,
  Wheat, Shield, BarChart2, Sprout, CreditCard,
  FlaskConical, ChevronRight, Zap, Globe, ArrowUpRight,
} from 'lucide-react';

/* ─── static scheme data (shown in cards, no API needed) ─── */
const SCHEMES = [
  {
    id: 'pmkisan',
    icon: Wheat,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    name: 'PM-KISAN',
    fullName: 'Pradhan Mantri Kisan Samman Nidhi',
    desc: 'Direct income support of ₹6,000/year to eligible farmer families in 3 installments.',
    stats: [
      { label: 'Farmers Enrolled', value: '11.8 Cr', icon: Users },
      { label: 'Amount Disbursed', value: '₹2.81L Cr', icon: Wallet },
      { label: 'Success Rate', value: '94.2%', icon: CheckCircle2 },
    ],
    badge: 'Central Scheme',
    trend: '+8.4%',
    trendUp: true,
  },
  {
    id: 'pmfby',
    icon: Shield,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-500',
    name: 'PMFBY',
    fullName: 'Pradhan Mantri Fasal Bima Yojana',
    desc: 'Comprehensive crop insurance covering sowing, standing crop, post-harvest losses.',
    stats: [
      { label: 'Claims Settled', value: '1.24 Cr', icon: CheckCircle2 },
      { label: 'Coverage', value: '5.5 Cr ha', icon: Globe },
      { label: 'Claim Ratio', value: '87.6%', icon: BarChart2 },
    ],
    badge: 'Insurance',
    trend: '+5.1%',
    trendUp: true,
  },
  {
    id: 'enam',
    icon: BarChart2,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-500',
    name: 'eNAM',
    fullName: 'Electronic National Agriculture Market',
    desc: 'Online trading platform connecting farmers, traders, and buyers across mandis.',
    stats: [
      { label: 'Trading Volume', value: '₹8.74L Cr', icon: TrendingUp },
      { label: 'Mandis Linked', value: '1,361', icon: Building2 },
      { label: 'Participation', value: '1.75 Cr', icon: Users },
    ],
    badge: 'Digital Market',
    trend: '+12.3%',
    trendUp: true,
  },
  {
    id: 'aif',
    icon: Sprout,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    name: 'Agri Infra Fund',
    fullName: 'Agriculture Infrastructure Fund',
    desc: '₹1 lakh crore financing facility for post-harvest management & community farm assets.',
    stats: [
      { label: 'Projects Funded', value: '74,246', icon: Building2 },
      { label: 'Investment', value: '₹45,180 Cr', icon: Wallet },
      { label: 'FPOs Benefited', value: '4,820', icon: Zap },
    ],
    badge: 'Infrastructure',
    trend: '+18.7%',
    trendUp: true,
  },
  {
    id: 'kcc',
    icon: CreditCard,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-500',
    name: 'KCC',
    fullName: 'Kisan Credit Card',
    desc: 'Flexible revolving credit for short-term crop, post-harvest, and allied activity needs.',
    stats: [
      { label: 'Cards Issued', value: '7.4 Cr', icon: CreditCard },
      { label: 'Credit Limit', value: '₹8.85L Cr', icon: Wallet },
      { label: 'Avg. Limit/Card', value: '₹1.19L', icon: TrendingUp },
    ],
    badge: 'Credit',
    trend: '-2.1%',
    trendUp: false,
  },
  {
    id: 'shc',
    icon: FlaskConical,
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-500',
    name: 'Soil Health Card',
    fullName: 'Soil Health Card Scheme',
    desc: 'Bi-annual soil testing and personalized fertilizer recommendations for every farm.',
    stats: [
      { label: 'Cards Issued', value: '23.1 Cr', icon: FlaskConical },
      { label: 'Samples Tested', value: '2.53 Cr', icon: CheckCircle2 },
      { label: 'Farms Covered', value: '14 Cr', icon: Wheat },
    ],
    badge: 'Advisory',
    trend: '+3.2%',
    trendUp: true,
  },
];

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    ring: 'ring-blue-200',    icon: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  ring: 'ring-violet-200',  icon: 'text-violet-600',  badge: 'bg-violet-100 text-violet-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   ring: 'ring-amber-200',   icon: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    ring: 'ring-rose-200',    icon: 'text-rose-600',    badge: 'bg-rose-100 text-rose-700' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    ring: 'ring-teal-200',    icon: 'text-teal-600',    badge: 'bg-teal-100 text-teal-700' },
};

/* animated sync icon */
function SyncIcon({ size = 48 }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
      <div className="relative bg-white rounded-full p-3 shadow-md ring-1 ring-emerald-200">
        <RefreshCw className="text-emerald-600 animate-spin" style={{ width: size * 0.42, height: size * 0.42, animationDuration: '2.5s' }} />
      </div>
    </div>
  );
}

/* donut SVG */
function DonutChart() {
  const segments = [
    { label: 'PM-KISAN', pct: 32, color: '#10b981' },
    { label: 'PMFBY',    pct: 20, color: '#3b82f6' },
    { label: 'eNAM',     pct: 18, color: '#8b5cf6' },
    { label: 'AIF',      pct: 14, color: '#f59e0b' },
    { label: 'KCC',      pct: 10, color: '#f43f5e' },
    { label: 'SHC',      pct:  6, color: '#14b8a6' },
  ];
  const r = 60, cx = 80, cy = 80, stroke = 20;
  let offset = 0;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {segments.map((s) => {
          const dash = (s.pct / 100) * circ;
          const gap  = circ - dash;
          const el = (
            <circle
              key={s.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ / 100 + circ / 4}
              style={{ transition: 'stroke-dasharray .6s ease' }}
            />
          );
          offset += s.pct;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-gray-800" fontSize={22} fontWeight={700}>6</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-gray-400" fontSize={10}>Schemes</text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="font-medium">{s.label}</span>
            <span className="ml-auto text-gray-400 font-semibold">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* sparkline */
function Sparkline({ up = true }) {
  const vals = up
    ? [30, 38, 34, 45, 42, 55, 52, 65, 61, 74]
    : [74, 65, 68, 58, 60, 50, 53, 43, 46, 36];
  const min = Math.min(...vals), max = Math.max(...vals);
  const norm = (v) => 28 - ((v - min) / (max - min)) * 24;
  const pts = vals.map((v, i) => `${i * 9},${norm(v)}`).join(' ');
  return (
    <svg width={82} height={32} viewBox="0 0 82 32" fill="none">
      <polyline points={pts} stroke={up ? '#10b981' : '#f43f5e'} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ─── main component ─── */
export default function SchemePerformance() {
  const API_READY = false; // flip to true once APIs are integrated

  const KPI_CARDS = [
    { label: 'Total Active Schemes', value: '24', sub: '+3 this quarter', icon: Landmark, color: 'emerald', trendUp: true },
    { label: 'Beneficiary Farmers',  value: '14.2 Cr', sub: '+8.4% YoY',   icon: Users,    color: 'blue',    trendUp: true },
    { label: 'Participating FPOs',   value: '8,640',   sub: '+420 joined',  icon: Building2, color: 'violet', trendUp: true },
    { label: 'Benefits Distributed', value: '₹4.2L Cr', sub: 'FY 2024–25', icon: Wallet,   color: 'amber',   trendUp: true },
  ];

  const RANKING = [
    { name: 'PM-KISAN',     pct: 94, beneficiaries: '11.8 Cr', rate: '94.2%', color: '#10b981', trendUp: true },
    { name: 'PMFBY',        pct: 87, beneficiaries: '5.5 Cr',  rate: '87.6%', color: '#3b82f6', trendUp: true },
    { name: 'eNAM',         pct: 81, beneficiaries: '1.75 Cr', rate: '81.4%', color: '#8b5cf6', trendUp: true },
    { name: 'Agri Infra',   pct: 74, beneficiaries: '74,246',  rate: '74.0%', color: '#f59e0b', trendUp: true },
    { name: 'KCC',          pct: 68, beneficiaries: '7.4 Cr',  rate: '68.3%', color: '#f43f5e', trendUp: false },
    { name: 'Soil Health',  pct: 61, beneficiaries: '14 Cr',   rate: '61.2%', color: '#14b8a6', trendUp: true },
  ];

  /* progress bar animation */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div className="space-y-8 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Landmark className="w-4 h-4 text-white" />
            </span>
            Scheme Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">Government scheme performance & beneficiary analytics for FPOs and CBBOs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Integration Pending
          </span>
          <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-full">FY 2024–25</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ label, value, sub, icon: Icon, color, trendUp }) => {
          const c = COLOR_MAP[color];
          return (
            <div key={label} className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                {trendUp
                  ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><TrendingUp className="w-3 h-3" />{sub.split(' ')[0]}</span>
                  : <span className="flex items-center gap-1 text-xs text-rose-500 font-semibold"><TrendingDown className="w-3 h-3" />{sub.split(' ')[0]}</span>
                }
              </div>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Empty state banner (shown until API is ready) ── */}
      {!API_READY && (
        <div className="relative overflow-hidden bg-white rounded-[20px] border border-slate-100 shadow-sm">
          {/* gradient accent */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-400 rounded-full opacity-[0.06] blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-400 rounded-full opacity-[0.06] blur-3xl" />
          </div>

          <div className="relative flex flex-col lg:flex-row items-center gap-8 p-8 lg:p-10">
            {/* illustration side */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              <SyncIcon size={72} />
              {/* mini progress bar */}
              <div className="w-48 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>API Integration</span>
                  <span className="font-semibold text-emerald-600">62%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" style={{ width: '62%', transition: 'width 1.2s ease' }} />
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold tracking-wide shadow-sm">
                COMING SOON
              </span>
            </div>

            {/* text side */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Government Scheme APIs are currently under integration</h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                Our backend team is actively connecting official government data sources — MoA&FW, PM-KISAN portal, PMFBY, eNAM, and AIF APIs. Once integration is completed, this dashboard will display <span className="font-semibold text-slate-700">real-time scheme performance</span>, beneficiary statistics, fund utilization, adoption trends, and district-wise analytics for Farmers, FPOs, and CBBOs.
              </p>

              {/* progress steps */}
              <div className="mt-5 flex flex-wrap justify-center lg:justify-start gap-3">
                {[
                  { label: 'PM-KISAN API',   done: true },
                  { label: 'PMFBY API',      done: true },
                  { label: 'eNAM API',       done: false },
                  { label: 'AIF Portal',     done: false },
                  { label: 'KCC Data Feed',  done: false },
                ].map(({ label, done }) => (
                  <span key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    done
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {done
                      ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      : <Clock className="w-3 h-3" />
                    }
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Scheme Performance Ranking */}
        <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Scheme Performance Ranking</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ranked by beneficiary success rate</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg font-medium">National Average</span>
          </div>
          <div className="p-6 space-y-5">
            {RANKING.map((s, i) => (
              <div key={s.name} className="group">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-slate-800">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <Sparkline up={s.trendUp} />
                    <span className={`text-xs font-bold ${s.trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>{s.rate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: mounted ? `${s.pct}%` : '0%', background: s.color }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right font-medium">{s.beneficiaries}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
            <h3 className="font-bold text-slate-800 text-sm">Scheme Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">By beneficiary share</p>
          </div>
          <div className="p-6">
            <DonutChart />
          </div>
        </div>
      </div>

      {/* ── Scheme Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Scheme Profiles</h3>
          <span className="text-xs text-slate-400">National data · Updated quarterly</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {SCHEMES.map((s) => {
            const c = COLOR_MAP[s.color];
            const Icon = s.icon;
            return (
              <div key={s.id} className="group bg-white rounded-[20px] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
                {/* card header gradient */}
                <div className={`bg-gradient-to-r ${s.gradient} px-5 py-4 flex items-start justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{s.name}</p>
                      <p className="text-white/70 text-[10px] font-medium">{s.badge}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm ${s.trendUp ? 'text-white' : 'text-rose-100'}`}>
                    {s.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {s.trend}
                  </span>
                </div>

                {/* body */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>

                  <div className="grid grid-cols-3 gap-2">
                    {s.stats.map(({ label, value, icon: StatIcon }) => (
                      <div key={label} className={`${c.bg} rounded-xl p-2.5 text-center`}>
                        <p className={`text-xs font-bold ${c.text} mb-0.5`}>{value}</p>
                        <p className="text-[10px] text-slate-400 leading-tight">{label}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    disabled
                    className={`mt-auto w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border ${c.border} ${c.bg} ${c.text} opacity-60 cursor-not-allowed`}
                    title="Available after API integration"
                  >
                    View Live Data <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Analytics Widgets (empty state placeholders) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Analytics Widgets</h3>
          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Awaiting API
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: 'Scheme Adoption Trend',     icon: TrendingUp,  desc: 'Monthly enrollment growth across all schemes' },
            { title: 'District-wise Coverage',    icon: Globe,       desc: 'Heatmap of scheme reach per district' },
            { title: 'FPO Participation Chart',   icon: Building2,   desc: 'FPO-level participation rates by scheme' },
            { title: 'Farmer Enrollment Growth',  icon: Users,       desc: 'Quarter-over-quarter farmer enrollment' },
          ].map(({ title, icon: Icon, desc }) => (
            <div key={title} className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center gap-3 min-h-[160px] justify-center">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-300 to-teal-300 rounded-full animate-pulse" style={{ width: '45%' }} />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Live data available after integration</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
