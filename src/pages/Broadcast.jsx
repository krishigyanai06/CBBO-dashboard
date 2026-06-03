import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBroadcastHistory } from '../store/thunks/broadcastThunk';
import { Bell, Eye, X, History } from 'lucide-react';
import { SkeletonHeader, SkeletonTable } from '../components/Skeleton';

const fmt = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function Broadcast() {
  const dispatch = useDispatch();
  const { broadcasts, loading } = useSelector((s) => ({
    broadcasts: Array.isArray(s.broadcast?.broadcasts) ? s.broadcast.broadcasts : [],
    loading: s.broadcast?.loading || false,
  }));

  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const demoMode = useSelector((s) => s.layout.demoMode);
  useEffect(() => { dispatch(fetchBroadcastHistory()); }, [dispatch, demoMode]);

  const totalPages = Math.ceil(broadcasts.length / PER_PAGE);
  const paginated = broadcasts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading && !broadcasts.length) return (
    <div className="space-y-6"><SkeletonHeader /><SkeletonTable rows={5} cols={5} /></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Read-only broadcast history for CBBO monitoring</p>
        </div>
        <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">🔒 Read-Only</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-800">Broadcast History</h2>
          <span className="ml-auto text-xs text-gray-400">{broadcasts.length} total</span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold">
            <tr>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-left">Target Role</th>
              <th className="px-6 py-3 text-left">Sent Date</th>
              <th className="px-6 py-3 text-center">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length > 0 ? paginated.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-800">{b.title}</td>
                <td className="px-6 py-4 max-w-xs truncate text-gray-500">{b.description}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{b.targetRole || 'All'}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{fmt(b.createdAt)}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => setSelected(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No broadcasts found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800">Broadcast Details</h2>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Title</p><p className="text-gray-800 font-medium">{selected.title}</p></div>
              <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Description</p><p className="text-gray-700">{selected.description}</p></div>
              <div className="flex gap-6">
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Target</p><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{selected.targetRole || 'All'}</span></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Sent</p><p className="text-sm text-gray-700">{fmt(selected.createdAt)}</p></div>
              </div>
              {selected.broadcastImage && (
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-2">Image</p><img src={selected.broadcastImage} alt="Broadcast" className="max-h-48 rounded-xl" /></div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setSelected(null)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
