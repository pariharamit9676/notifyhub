import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, ResponsiveContainer
} from 'recharts';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';
import RecentNotificationsTable from '../components/ui/RecentNotificationsTable';

const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, queued: 0, processing: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [logsRes, statsRes] = await Promise.all([
          api.get('/logs'),
          api.get('/logs/stats')
        ]);
        setLogs(logsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Calculate real metrics
  const successCount = stats.sent + (stats.delivered || 0);
  const failCount = (stats.failed || 0) + (stats.dropped || 0) + (stats.bounced || 0) + (stats.bounce || 0);
  const successRate = stats.total > 0 ? ((successCount / stats.total) * 100).toFixed(1) : '0.0';

  const statsData = [
    { id: 1, title: 'Total Processed', value: stats.total.toString(), icon: '📊', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 2, title: 'Successfully Sent', value: successCount.toString(), icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
    { id: 3, title: 'In Queue', value: ((stats.queued || 0) + (stats.processing || 0)).toString(), icon: '⏳', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 4, title: 'Failed / Dropped', value: failCount.toString(), icon: '❌', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  // Bar chart: Last 7 days activity
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { date: d.toISOString().split('T')[0], day: d.toLocaleDateString('en-US', { weekday: 'short' }), count: 0 };
  });
  logs.forEach(log => {
    const logDate = new Date(log.createdAt).toISOString().split('T')[0];
    const dayData = last7Days.find(d => d.date === logDate);
    if (dayData) dayData.count++;
  });

  // Status breakdown for horizontal bar chart
  const statusBreakdown = [
    { name: 'Sent', value: successCount, color: '#10B981' },
    { name: 'Processing', value: (stats.queued || 0) + (stats.processing || 0), color: '#F59E0B' },
    { name: 'Failed', value: failCount, color: '#EF4444' },
    { name: 'Dropped', value: stats.dropped || 0, color: '#6B7280' },
  ].filter(s => s.value > 0);

  const recentNotifications = logs.slice(0, 8);

  return (
    <>
      <div className="space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat) => (
            <StatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              bgClass={stat.bg}
              loading={loading}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Last 7 Days Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Activity — Last 7 Days</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <BarTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status Breakdown</h3>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : statusBreakdown.length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet.</p>
            ) : (
              <div className="space-y-4">
                {statusBreakdown.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : '0%',
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-500">Overall Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications Table */}
        <RecentNotificationsTable logs={recentNotifications} loading={loading} showViewAll={true} />

      </div>
    </>
  );
};

export default Dashboard;
