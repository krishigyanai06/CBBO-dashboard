import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function ProtectedRoute({ children }) {
  const { loading, token, isAuthenticated } = useSelector((s) => s.auth);

  const rawToken = localStorage.getItem('token');
  const hasToken = token || (rawToken && rawToken !== 'undefined' && rawToken !== 'null');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
