import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend
} from 'recharts';
import { FaDownload, FaSync } from 'react-icons/fa';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';
import RecentNotificationsTable from '../components/ui/RecentNotificationsTable';

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('7days');
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, sent: 0, failed: 0, queued: 0 });

  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/logs'),
        api.get('/logs/stats')
      ]);
      
      setLogs(logsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter logs by dateRange
  const filteredLogs = logs.filter(log => {
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(log.createdAt) >= cutoff;
  });

  const successCount = stats.sent + (stats.delivered || 0);
  const failCount = (stats.failed || 0) + (stats.dropped || 0) + (stats.bounced || 0) + (stats.bounce || 0);
  
  const successRate = stats.total > 0
    ? ((successCount / stats.total) * 100).toFixed(1)
    : '0.0';

  const statsData = [
    { id: 1, title: 'Total Processed', value: stats.total.toString(), icon: '📊', bg: 'bg-blue-50' },
    { id: 2, title: 'Successfully Sent', value: successCount.toString(), icon: '✅', bg: 'bg-emerald-50' },
    { id: 3, title: 'In Queue', value: ((stats.queued || 0) + (stats.processing || 0)).toString(), icon: '⏳', bg: 'bg-amber-50' },
    { id: 4, title: 'Failed / Dropped', value: failCount.toString(), icon: '❌', bg: 'bg-red-50' },
  ];

  // Line Chart — notifications per day for selected range
  const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
  const lineData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (Math.min(days, 30) - 1 - i));
    return {
      date: d.toISOString().split('T')[0],
      day: days <= 7
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0
    };
  });

  filteredLogs.forEach(log => {
    const logDate = new Date(log.createdAt).toISOString().split('T')[0];
    const entry = lineData.find(d => d.date === logDate);
    if (entry) entry.count++;
  });

  // Pie Chart — channel breakdown
  const channelCounts = filteredLogs.reduce((acc: any, log: any) => {
    acc[log.channel] = (acc[log.channel] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(channelCounts).map((ch, i) => ({
    name: ch.toUpperCase(),
    value: channelCounts[ch],
    color: ['#4F46E5', '#10B981', '#F59E0B'][i % 3]
  }));

  const handleExport = () => {
    const rows = [
      ['Date', 'Recipient', 'Subject', 'Channel', 'Status', 'Message ID / Error'],
      ...filteredLogs.map(log => [
        new Date(log.createdAt).toLocaleString(),
        log.recipient,
        log.subject,
        log.channel,
        log.status,
        log.messageId || log.errorMessage || '-'
      ])
    ];
    const csvContent = rows.map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifyhub-logs-${dateRange}.csv`;
    a.click();
  };

  return (
    <>
      <div className="space-y-6">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Analytics Overview</h2>
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : `Showing ${filteredLogs.length} notifications`}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
            
            <button
              onClick={fetchAnalytics}
              className="flex items-center px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
              title="Refresh"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-medium transition-colors"
            >
              <FaDownload className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

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
              description={stat.id === 2 ? `Success Rate: ${successRate}%` : undefined}
            />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Daily Notifications Line Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Notifications</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} interval={days <= 7 ? 0 : 'preserveStartEnd'} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <LineTooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                  />
                  <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Breakdown Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Breakdown</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1, color: '#E5E7EB' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1, color: '#E5E7EB' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <PieTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filtered Logs Table */}
        <RecentNotificationsTable logs={filteredLogs} loading={loading} showViewAll={false} />

      </div>
    </>
  );
};

export default Analytics;
