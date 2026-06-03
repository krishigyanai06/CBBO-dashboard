import { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { clearMe } from "../store/slices/layoutSlice";
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  BarChart3,
  Bell,
  LineChart,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Megaphone,
  Sprout,
  UserCog,
} from "lucide-react";
import { fetchMe } from "../store/thunks/layoutThunk";
import { fetchBroadcastHistory } from "../store/thunks/broadcastThunk";
import theme from "../config/theme";
import GoogleLangPicker from "./google-lang-picker/google-lang-picker";
import InstallPWA from "./InstallPWA";
import "./google-lang-picker/google-translate.css";

const MENU = [
  { icon: LayoutDashboard, label: "CBBO Overview", path: "/dashboard" },
  { icon: Building2, label: "FPO Analytics", path: "/cbbo/fpo-analytics" },
  { icon: Sprout, label: "Farmer Insights", path: "/cbbo/farmer-insights" },
  {
    icon: Activity,
    label: "Performance Analytics",
    path: "/cbbo/performance-analytics",
  },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: Bell, label: "System Alerts", path: "/broadcast" },
  {
    icon: LineChart,
    label: "Scheme Performance",
    path: "/cbbo/scheme-performance",
  },
  { icon: UserCog, label: "Profile Settings", path: "/cbbo/profile" },
];

const timeAgo = (date) => {
  if (!date) return "";
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // const [weather, setWeather] = useState(null);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { me } = useSelector((s) => s.layout);
  const { user, token } = useSelector((s) => s.auth);
  const demoMode = useSelector((s) => s.layout.demoMode);
  const broadcasts = useSelector((s) =>
    Array.isArray(s.broadcast?.broadcasts) ? s.broadcast.broadcasts : [],
  );

  useEffect(() => {
    if (!token) return;
    dispatch(fetchMe());
    dispatch(fetchBroadcastHistory());
  }, [token, dispatch, demoMode]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // useEffect(() => {
  //   const WMO = {
  //     0: { label: "Clear Sky", emoji: "☀️" },
  //     1: { label: "Mainly Clear", emoji: "🌤️" },
  //     2: { label: "Partly Cloudy", emoji: "⛅" },
  //     3: { label: "Overcast", emoji: "☁️" },
  //     61: { label: "Rain", emoji: "🌧️" },
  //     80: { label: "Showers", emoji: "🌦️" },
  //     95: { label: "Thunderstorm", emoji: "⛈️" },
  //   };
  //   navigator.geolocation?.getCurrentPosition(
  //     async ({ coords }) => {
  //       try {
  //         const res = await fetch(
  //           `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weathercode`,
  //         );
  //         const data = await res.json();
  //         const code = data.current.weathercode;
  //         setWeather({
  //           temp: Math.round(data.current.temperature_2m),
  //           ...(WMO[code] || { label: "Clear", emoji: "🌤️" }),
  //         });
  //       } catch {}
  //     },
  //     async () => {
  //       try {
  //         const res = await fetch(
  //           "https://api.open-meteo.com/v1/forecast?latitude=28.6&longitude=77.2&current=temperature_2m,weathercode",
  //         );
  //         const data = await res.json();
  //         const code = data.current.weathercode;
  //         setWeather({
  //           temp: Math.round(data.current.temperature_2m),
  //           ...(WMO[code] || { label: "Clear", emoji: "🌤️" }),
  //         });
  //       } catch {}
  //     },
  //   );
  // }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearMe());
    navigate("/login");
  };

  const currentPage =
    MENU.find((m) => m.path === location.pathname)?.label || "CBBO Overview";
  const displayName =
    me?.firstName || user?.firstName
      ? `${me?.firstName || user?.firstName} ${me?.lastName || user?.lastName || ""}`.trim()
      : "CBBO Officer";

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static z-40 h-full w-64 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "#0a1f0f" }}
      >
        {/* Brand */}
        <div
          className="mx-3 mt-4 mb-3 rounded-2xl p-4 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg,#0d2b14 0%,#1a4a24 50%,#0d2b14 100%)",
            border: "1px solid rgba(212,175,55,0.35)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(212,175,55,0.3) 20px,rgba(212,175,55,0.3) 21px)",
            }}
          />
          <div className="flex items-center gap-3 relative z-10">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-white"
              style={{ border: "1px solid rgba(212,175,55,0.4)" }}
            >
              <img
                src={theme.logo}
                alt={theme.brand}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: "#d4af37" }}>
                {theme.brand}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "#6dbf7e" }}>
                CBBO Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
          {MENU.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(135deg,#1a5c2a 0%,#0f3d1a 100%)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                        border: "1px solid rgba(109,191,126,0.2)",
                        color: "#ffffff",
                      }
                    : {
                        background: "transparent",
                        border: "1px solid transparent",
                        color: "rgba(109,191,126,0.85)",
                      }
                }
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ background: "#d4af37" }}
                  />
                )}
                <Icon
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: active ? "#6dbf7e" : "#4a9e5c" }}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {active ? (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "#4ade80",
                      boxShadow: "0 0 6px #4ade80",
                    }}
                  />
                ) : (
                  <svg
                    className="w-3.5 h-3.5 opacity-40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>

        {/* Weather widget */}
        {/* <div className="mx-3 mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#1a3a10 0%,#2a5a18 50%,#1a3a10 100%)', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          <span className="text-3xl">{weather ? weather.emoji : '⛅'}</span>
          <div>
            <p className="text-lg font-bold leading-none" style={{ color: '#d4af37' }}>{weather ? `${weather.temp}°C` : '--°C'}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6dbf7e' }}>{weather ? weather.label : 'Loading...'}</p>
          </div>
        </div> */}
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-gray-800">{currentPage}</p>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <InstallPWA />

            <GoogleLangPicker classes="d-none d-xl-block" />


            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowUserMenu(false);
                }}
                className={`relative p-2 rounded-xl transition ${showNotifications ? "bg-emerald-50 text-emerald-700" : "hover:bg-gray-100 text-gray-600"}`}
              >
                <Bell className="w-5 h-5" />
                {broadcasts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex justify-between items-center px-5 py-4 border-b bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-800">
                        System Alerts
                      </p>
                      <p className="text-xs text-gray-500">
                        {broadcasts.length} broadcast
                        {broadcasts.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/broadcast");
                        setShowNotifications(false);
                      }}
                      className="text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition"
                    >
                      View All
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {broadcasts.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No alerts yet</p>
                      </div>
                    ) : (
                      broadcasts.slice(0, 8).map((b) => (
                        <div
                          key={b._id}
                          className="flex gap-3 px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Megaphone className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {b.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {b.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {timeAgo(b.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setShowUserMenu((v) => !v);
                  setShowNotifications(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${showUserMenu ? "bg-emerald-50" : "hover:bg-gray-100"}`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-bold">
                  {(me?.firstName || user?.firstName || "C")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-sm font-medium text-gray-800">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500">CBBO Officer</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <p className="text-sm font-semibold text-gray-800">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      CBBO Analytics — Read Only
                    </p>
                  </div>
                  <div className="border-t py-1">
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/cbbo/profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <UserCog className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Sign Out</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to sign out?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition font-medium"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
