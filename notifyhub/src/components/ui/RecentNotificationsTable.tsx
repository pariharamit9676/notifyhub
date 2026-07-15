import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

interface RecentNotificationsTableProps {
  logs: any[];
  loading?: boolean;
  showViewAll?: boolean;
}

const RecentNotificationsTable: React.FC<RecentNotificationsTableProps> = ({ logs, loading, showViewAll }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden mt-8">
      <div className="px-7 py-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Recent Notifications</h3>
        {showViewAll && (
          <button
            onClick={() => navigate('/analytics')}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View All →
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap border-collapse">
          <thead>
            <tr>
              <th className="px-7 py-4 text-sm font-medium text-slate-400 border-y border-slate-100/80 bg-slate-50/30">Channel</th>
              <th className="px-7 py-4 text-sm font-medium text-slate-400 border-y border-slate-100/80 bg-slate-50/30">Recipient</th>
              <th className="px-7 py-4 text-sm font-medium text-slate-400 border-y border-slate-100/80 bg-slate-50/30">Subject</th>
              <th className="px-7 py-4 text-sm font-medium text-slate-400 border-y border-slate-100/80 bg-slate-50/30">Status</th>
              <th className="px-7 py-4 text-sm font-medium text-slate-400 border-y border-slate-100/80 bg-slate-50/30">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-7 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-xl">
                      📭
                    </div>
                    <span className="text-slate-500 text-sm">{loading ? 'Loading...' : 'No notifications yet. Send your first one!'}</span>
                  </div>
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-slate-50/60 transition-all duration-200 group">
                <td className="px-7 py-5">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium capitalize">
                    {log.channel}
                  </span>
                </td>
                <td className="px-7 py-5">
                  <div className="font-medium text-slate-900 text-sm truncate max-w-[200px] lg:max-w-[300px]" title={log.recipient}>
                    {log.recipient}
                  </div>
                </td>
                <td className="px-7 py-5 text-sm text-slate-600 truncate max-w-[200px]">{log.subject}</td>
                <td className="px-7 py-5">
                  <StatusBadge status={log.status} />
                </td>
                <td className="px-7 py-5 text-slate-500 text-sm">
                  {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentNotificationsTable;
