import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  sendBroadcast,
  fetchBroadcastHistory,
} from "../store/thunks/broadcastThunk";
import { clearSendState } from "../store/slices/broadcastSlice";
import { getCbboGlobalData } from "../store/thunks/cbboThunk";
import { DEMO_FARMERS_PER_TENANT } from "../lib/demoData";
import {
  Bell,
  Send,
  Eye,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  Zap,
  Clock,
  Filter,
  Search,
  Megaphone,
  RefreshCw,
  ImagePlus,
  Trash2,
  Loader2,
  WifiOff,
  Users,
  Building2,
  ChevronDown,
} from "lucide-react";

/* ─── Config ─── */
const TYPES = {
  critical: {
    label: "Critical",
    color: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    icon: AlertTriangle,
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    border: "border-l-red-500",
  },
  warning: {
    label: "Warning",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    icon: Zap,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    border: "border-l-amber-500",
  },
  info: {
    label: "Info",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    icon: Info,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    border: "border-l-blue-500",
  },
  success: {
    label: "Success",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    border: "border-l-emerald-500",
  },
};

const TARGET_ROLES = ["All FPOs"];
const CATEGORIES = [
  "General",
  "Procurement",
  "Finance",
  "Compliance",
  "Policy",
  "Weather",
  "Training",
  "Achievement",
];
const FILTER_TYPES = ["All", "critical", "warning", "info", "success"];
const PER_PAGE = 6;

const EMPTY_FORM = {
  title: "",
  message: "",
  type: "info",
  category: "General",
  targetAll: true,
  targetFpoIds: [],
  image: null,
};

/* ─── Helpers ─── */
const timeAgo = (iso) => {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
};
const fmtFull = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/* ─── Demo history (shown when API not yet live) ─── */
const DEMO_HISTORY = [
  {
    _id: "d1",
    type: "critical",
    category: "Procurement",
    title: "Low Stock Alert – Wheat (Rabi Season)",
    description:
      "Procurement stock for wheat has fallen below the minimum threshold of 500 MT across 3 FPOs.",
    targetRole: "FPO Manager",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    _id: "d2",
    type: "warning",
    category: "Finance",
    title: "Pending Dues – 5 FPOs Outstanding",
    description:
      "Five linked FPOs have outstanding dues exceeding ₹2.5 lakh each.",
    targetRole: "Accountant",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    _id: "d3",
    type: "info",
    category: "Policy",
    title: "New MSP Rates Effective From 1st June 2025",
    description: "Revised Minimum Support Prices for Kharif crops.",
    targetRole: "All FPOs",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    _id: "d4",
    type: "success",
    category: "Achievement",
    title: "Quarterly Target Achieved – Q1 FY2025-26",
    description: "All 12 linked FPOs achieved 108% of Q1 procurement target.",
    targetRole: "All FPOs",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    _id: "d5",
    type: "warning",
    category: "Compliance",
    title: "KYC Renewal Pending for 18 Farmers",
    description:
      "18 farmer members across 4 FPOs have KYC expiring within 30 days.",
    targetRole: "Field Officer",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    _id: "d6",
    type: "critical",
    category: "Weather",
    title: "IMD Alert – Heavy Rainfall in Zone B",
    description:
      "Red alert issued for heavy rainfall in Zone B over next 72 hours.",
    targetRole: "All FPOs",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
];

/* ═══════════════════════════════════════════════════════ */
export default function Broadcast() {
  const dispatch = useDispatch();
  const { broadcasts, loading, sending, sendError, sendSuccess } = useSelector(
    (s) => ({
      broadcasts: Array.isArray(s.broadcast?.broadcasts)
        ? s.broadcast.broadcasts
        : [],
      loading: s.broadcast?.loading || false,
      sending: s.broadcast?.sending || false,
      sendError: s.broadcast?.sendError || null,
      sendSuccess: s.broadcast?.sendSuccess || false,
    }),
  );
  const demoMode = useSelector((s) => s.layout.demoMode);
  const fpoList = useSelector((s) =>
    Array.isArray(s.cbbo?.fpos) && s.cbbo.fpos.length > 0
      ? s.cbbo.fpos
      : DEMO_FARMERS_PER_TENANT.map((t) => ({
          id: t.tenantId,
          name: t.tenantName,
          code: t.tenantCode,
        })),
  );

  /* local state */
  const [form, setForm] = useState(EMPTY_FORM);
  const [imgPreview, setImgPreview] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [readIds, setReadIds] = useState(new Set());
  const [fpoSearch, setFpoSearch] = useState("");
  const [fpoOpen, setFpoOpen] = useState(false);
  const fileRef = useRef(null);
  const fpoRef = useRef(null);

  const history =
    demoMode || broadcasts.length === 0 ? DEMO_HISTORY : broadcasts;

  useEffect(() => {
    dispatch(fetchBroadcastHistory());
    // fetch FPO list if not already loaded
    dispatch(getCbboGlobalData());
  }, [dispatch, demoMode]);

  /* close FPO dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (fpoRef.current && !fpoRef.current.contains(e.target))
        setFpoOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* auto-clear send success after 3s */
  useEffect(() => {
    if (!sendSuccess) return;
    const t = setTimeout(() => {
      dispatch(clearSendState());
      setForm(EMPTY_FORM);
      setImgPreview(null);
    }, 3000);
    return () => clearTimeout(t);
  }, [sendSuccess, dispatch]);

  /* form handlers */
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("image", file);
    setImgPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    set("image", null);
    setImgPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = () => {
    if (!form.title.trim() || !form.message.trim()) return;
    if (!form.targetAll && form.targetFpoIds.length === 0) return;
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.message.trim());
    fd.append("type", form.type);
    fd.append("category", form.category);
    if (form.targetAll) {
      fd.append("targetRole", "All FPOs");
    } else {
      form.targetFpoIds.forEach((id) => fd.append("targetFpoIds[]", id));
    }
    if (form.image) fd.append("broadcastImage", form.image);
    dispatch(sendBroadcast(fd));
  };

  /* FPO picker helpers */
  const toggleFpo = (id) =>
    set(
      "targetFpoIds",
      form.targetFpoIds.includes(id)
        ? form.targetFpoIds.filter((x) => x !== id)
        : [...form.targetFpoIds, id],
    );

  const filteredFpos = fpoList.filter(
    (f) =>
      f.name.toLowerCase().includes(fpoSearch.toLowerCase()) ||
      (f.code || "").toLowerCase().includes(fpoSearch.toLowerCase()),
  );

  const selectedFpoNames = fpoList
    .filter((f) => form.targetFpoIds.includes(f.id))
    .map((f) => f.name);

  /* history filters */
  const filtered = history.filter((a) => {
    const matchType = filter === "All" || a.type === filter;
    const q = search.toLowerCase();
    return (
      matchType && (!q || (a.title + a.category).toLowerCase().includes(q))
    );
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openDetail = (a) => {
    setReadIds((s) => new Set([...s, a._id]));
    setSelected(a);
  };
  const unread = history.filter((a) => !readIds.has(a._id)).length;

  /* ── JSX ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            System Alerts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Send notifications from CBBO to all linked FPOs
          </p>
        </div>
      </div>

      {/* ── COMPOSE PANEL ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-gray-800">
            Compose Alert
          </h2>
          <span className="ml-auto text-xs text-gray-400">
            Sent to all linked FPOs instantly
          </span>
        </div>

        <div className="p-6 space-y-4">
          {/* Row 1 – title */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Alert Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Low Stock Alert – Wheat (Rabi Season)"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={120}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Row 2 – dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                Severity
              </label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {Object.entries(TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            {/* Target */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                Target Audience
              </label>
              {/* Toggle */}
              <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-2">
                <button
                  type="button"
                  onClick={() => {
                    set("targetAll", true);
                    set("targetFpoIds", []);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
                    form.targetAll
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> All FPOs
                </button>
                <button
                  type="button"
                  onClick={() => set("targetAll", false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
                    !form.targetAll
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Specific FPOs
                </button>
              </div>

              {/* Multi-select FPO picker */}
              {!form.targetAll && (
                <div className="relative" ref={fpoRef}>
                  <button
                    type="button"
                    onClick={() => setFpoOpen((v) => !v)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <span className="truncate text-gray-600">
                      {form.targetFpoIds.length === 0
                        ? "Select FPOs…"
                        : `${form.targetFpoIds.length} FPO${form.targetFpoIds.length > 1 ? "s" : ""} selected`}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${fpoOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {fpoOpen && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                      {/* Search inside dropdown */}
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search FPO name or code…"
                            value={fpoSearch}
                            onChange={(e) => setFpoSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      {/* Select/clear all */}
                      <div className="flex gap-2 px-3 py-1.5 border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "targetFpoIds",
                              filteredFpos.map((f) => f.id),
                            )
                          }
                          className="text-xs text-emerald-600 hover:underline font-medium"
                        >
                          Select all
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => set("targetFpoIds", [])}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Clear
                        </button>
                        <span className="ml-auto text-xs text-gray-400">
                          {filteredFpos.length} FPOs
                        </span>
                      </div>
                      {/* FPO list */}
                      <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                        {filteredFpos.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">
                            No FPOs found
                          </p>
                        ) : (
                          filteredFpos.map((fpo) => {
                            const checked = form.targetFpoIds.includes(fpo.id);
                            return (
                              <label
                                key={fpo.id}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleFpo(fpo.id)}
                                  className="w-4 h-4 accent-emerald-600 rounded flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 truncate">
                                    {fpo.name}
                                  </p>
                                  {fpo.code && (
                                    <p className="text-xs text-gray-400">
                                      {fpo.code}
                                    </p>
                                  )}
                                </div>
                                {checked && (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected chips */}
                  {form.targetFpoIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {fpoList
                        .filter((f) => form.targetFpoIds.includes(f.id))
                        .map((fpo) => (
                          <span
                            key={fpo.id}
                            className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium"
                          >
                            {fpo.name}
                            <button
                              type="button"
                              onClick={() => toggleFpo(fpo.id)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 3 – message */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Message *
            </label>
            <textarea
              rows={4}
              placeholder="Write the full alert message that will be sent to all linked FPOs…"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              maxLength={1000}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {form.message.length}/1000
            </p>
          </div>

          {/* Row 4 – image upload */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Attach Image (optional)
            </label>
            {imgPreview ? (
              <div className="relative inline-block">
                <img
                  src={imgPreview}
                  alt="Preview"
                  className="h-28 rounded-xl border border-gray-200 object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition"
              >
                <ImagePlus className="w-4 h-4" />
                Click to upload image
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImage}
            />
          </div>

          {/* Preview chip */}
          {(form.title || form.type) && (
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${TYPES[form.type]?.color}`}
            >
              {(() => {
                const Icon = TYPES[form.type]?.icon;
                return Icon ? (
                  <Icon className={`w-4 h-4 ${TYPES[form.type].iconColor}`} />
                ) : null;
              })()}
              <span className="text-sm font-medium truncate">
                {form.title || "Alert preview…"}
              </span>
              <span className="ml-auto text-xs opacity-70">
                {form.targetAll
                  ? "All FPOs"
                  : `${form.targetFpoIds.length} FPO(s)`}
              </span>
            </div>
          )}

          {/* Error / Success */}
          {sendError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {sendError}
            </div>
          )}
          {sendSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Alert sent successfully to all linked FPOs!
            </div>
          )}

          {/* Send button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSend}
              disabled={
                sending ||
                !form.title.trim() ||
                !form.message.trim() ||
                (!form.targetAll && form.targetFpoIds.length === 0)
              }
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Sending…" : "Send Alert"}
            </button>
          </div>
        </div>
      </div>

      {/* ── HISTORY ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800">
              Broadcast History
            </h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {history.length} total
            </span>
            {unread > 0 && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            {FILTER_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilter(t);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${filter === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
              >
                {t === "All" ? "All" : TYPES[t].label}
              </button>
            ))}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white w-36"
              />
            </div>
          </div>
        </div>

        {/* refresh hint when API ready */}
        {!demoMode && broadcasts.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Showing demo data. Once the CBBO broadcast API is live, real
              alerts sent by CBBOs will appear here automatically.
            </p>
          </div>
        )}

        {loading && !history.length ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No alerts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((alert) => {
              const cfg = TYPES[alert.type] || TYPES.info;
              const Icon = cfg.icon;
              const isNew = !readIds.has(alert._id);
              return (
                <div
                  key={alert._id}
                  onClick={() => openDetail(alert)}
                  className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${cfg.border} shadow-sm hover:shadow-md transition cursor-pointer group`}
                >
                  <div className="px-5 py-4 flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}
                    >
                      <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p
                          className={`text-sm text-gray-800 ${isNew ? "font-bold" : "font-semibold"} flex items-center gap-2`}
                        >
                          {alert.title}
                          {isNew && (
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}
                            />
                          )}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                          {alert.category && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                              {alert.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {alert.targetRole && (
                          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                            → {alert.targetRole}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {timeAgo(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition flex-shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-400">
              {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {selected &&
        (() => {
          const cfg = TYPES[selected.type] || TYPES.info;
          const Icon = cfg.icon;
          return (
            <div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelected(null)}
            >
              <div
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`px-6 py-4 border-b flex items-center gap-3 ${cfg.iconBg}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.iconBg} border border-white/40`}
                  >
                    <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {selected.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      {selected.category && (
                        <span className="text-xs bg-white/80 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-medium">
                          {selected.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 hover:bg-white/70 rounded-lg transition"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                      Message
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selected.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                        Target
                      </p>
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">
                        {selected.targetRole || "All FPOs"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                        Sent
                      </p>
                      <p className="text-sm text-gray-700">
                        {fmtFull(selected.createdAt)}
                      </p>
                    </div>
                  </div>
                  {selected.broadcastImage && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-2">
                        Image
                      </p>
                      <img
                        src={selected.broadcastImage}
                        alt="Broadcast"
                        className="max-h-48 rounded-xl border border-gray-200"
                      />
                    </div>
                  )}
                </div>
                <div className="px-6 pb-5 flex justify-end">
                  <button
                    onClick={() => setSelected(null)}
                    className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
