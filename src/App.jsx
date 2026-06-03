import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';

const Dashboard           = lazy(() => import('./pages/Dashboard'));
const Reports             = lazy(() => import('./pages/Reports'));
const Broadcast           = lazy(() => import('./pages/Broadcast'));
const FpoAnalytics        = lazy(() => import('./pages/cbbo/FpoAnalytics'));
const FarmerInsights      = lazy(() => import('./pages/cbbo/FarmerInsights'));
const PerformanceAnalytics = lazy(() => import('./pages/cbbo/PerformanceAnalytics'));
const SchemePerformance   = lazy(() => import('./pages/cbbo/SchemePerformance'));
const ProfileSettings     = lazy(() => import('./pages/cbbo/ProfileSettings'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"                  element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
            <Route path="reports"                    element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
            <Route path="broadcast"                  element={<Suspense fallback={<PageLoader />}><Broadcast /></Suspense>} />
            <Route path="cbbo/fpo-analytics"         element={<Suspense fallback={<PageLoader />}><FpoAnalytics /></Suspense>} />
            <Route path="cbbo/farmer-insights"       element={<Suspense fallback={<PageLoader />}><FarmerInsights /></Suspense>} />
            <Route path="cbbo/performance-analytics" element={<Suspense fallback={<PageLoader />}><PerformanceAnalytics /></Suspense>} />
            <Route path="cbbo/scheme-performance"    element={<Suspense fallback={<PageLoader />}><SchemePerformance /></Suspense>} />
            <Route path="cbbo/profile"               element={<Suspense fallback={<PageLoader />}><ProfileSettings /></Suspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
