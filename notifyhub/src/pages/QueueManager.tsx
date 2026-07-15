import React, { useState, useEffect } from 'react';
import { FaPause, FaPlay, FaRedo, FaTrash, FaCheckCircle, FaExclamationTriangle, FaClock, FaSpinner, FaBroom } from 'react-icons/fa';
import { io } from 'socket.io-client';
import api from '../api/client';
import Button from '../components/ui/Button';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  isPaused: boolean;
}

interface Job {
  id: string;
  name: string;
  data: any;
  failedReason?: string;
  opts: any;
  processedOn?: number;
  finishedOn?: number;
  timestamp: number;
}

const QueueManager: React.FC = () => {
  const [activeQueue, setActiveQueue] = useState<'email' | 'push'>('email');
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [failedJobs, setFailedJobs] = useState<Job[]>([]);
  const [delayedJobs, setDelayedJobs] = useState<Job[]>([]);

  const fetchQueueStats = async () => {
    try {
      const [statsRes, failedRes, delayedRes] = await Promise.all([
        api.get(`/queue/stats?queue=${activeQueue}`),
        api.get(`/queue/jobs/failed?queue=${activeQueue}`),
        api.get(`/queue/jobs/delayed?queue=${activeQueue}`)
      ]);
      
      setStats(statsRes.data);
      setFailedJobs(failedRes.data);
      setDelayedJobs(delayedRes.data);
    } catch (err) {
      console.error('Failed to fetch queue stats', err);
    }
  };

  useEffect(() => {
    fetchQueueStats();

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001');

    socket.on('connect', () => {
      console.log('🟢 Connected to WebSocket Server');
    });

    socket.on('queueUpdate', () => {
      fetchQueueStats();
    });

    const interval = setInterval(fetchQueueStats, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [activeQueue]);

  const handleQueueAction = async (action: 'pause' | 'resume' | 'clean') => {
    try {
      await api.post(`/queue/${action}?queue=${activeQueue}`);
    } catch (err) {
      console.error(`Failed to ${action} queue`, err);
    }
  };

  const handleJobAction = async (id: string, action: 'retry' | 'remove') => {
    try {
      const endpoint = action === 'retry' 
        ? `/queue/job/${id}/retry?queue=${activeQueue}` 
        : `/queue/job/${id}?queue=${activeQueue}`;
      
      if (action === 'retry') {
        await api.post(endpoint);
      } else {
        await api.delete(endpoint);
      }
      
      setFailedJobs(prev => prev.filter(job => job.id !== id));
      setDelayedJobs(prev => prev.filter(job => job.id !== id));
    } catch (err) {
      console.error(`Failed to ${action} job`, err);
    }
  };

  return (
    <>
      <div className="space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">Queue Control Panel</h2>
              <select 
                value={activeQueue}
                onChange={(e) => setActiveQueue(e.target.value as 'email' | 'push')}
                className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 font-semibold"
              >
                <option value="email">✉️ Email Queue</option>
                <option value="push">📱 Push Queue</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">Monitor and manage background {activeQueue} jobs</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleQueueAction('clean')}
            >
              <FaBroom className="mr-2" /> Clean Old Jobs
            </Button>
            {stats?.isPaused ? (
              <Button
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleQueueAction('resume')}
              >
                <FaPlay className="mr-2" /> Resume Queue
              </Button>
            ) : (
              <Button
                variant="primary"
                className="bg-yellow-500 hover:bg-yellow-600"
                onClick={() => handleQueueAction('pause')}
              >
                <FaPause className="mr-2" /> Pause Queue
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: <FaClock className="text-indigo-500" />, label: 'Waiting',    value: stats?.waiting  ?? '-', bg: 'bg-indigo-50'  },
            { icon: <FaSpinner className={`text-violet-500 ${stats?.active ? 'animate-spin' : ''}`} />, label: 'Active', value: stats?.active ?? '-', bg: 'bg-violet-50' },
            { icon: <FaCheckCircle className="text-emerald-500" />, label: 'Completed', value: stats?.completed ?? '-', bg: 'bg-emerald-50' },
            { icon: <FaExclamationTriangle className="text-red-500" />, label: 'Failed (DLQ)', value: stats?.failed  ?? '-', bg: 'bg-red-50'    },
            { icon: <FaClock className="text-amber-500" />, label: 'Delayed',   value: stats?.delayed  ?? '-', bg: 'bg-amber-50'  },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl border border-white/80 shadow-sm p-5 flex flex-col items-center justify-center`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <span className="text-3xl font-bold text-slate-800">{s.value}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1.5">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delayed Jobs Table */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                <FaClock className="text-amber-500" /> Scheduled / Delayed
              </h3>
              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold">{delayedJobs.length}</span>
            </div>
            <div className="p-0 overflow-x-auto max-h-96">
              {delayedJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No delayed jobs.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-400 text-sm font-medium sticky top-0">
                    <tr>
                      <th className="px-7 py-4 border-b border-slate-100 bg-slate-50/30">ID</th>
                      <th className="px-7 py-4 border-b border-slate-100 bg-slate-50/30">Recipient</th>
                      <th className="px-7 py-4 border-b border-slate-100 bg-slate-50/30">Scheduled For</th>
                      <th className="px-7 py-4 border-b border-slate-100 bg-slate-50/30 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-slate-600">
                    {delayedJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/60 transition-all duration-200 group">
                        <td className="px-7 py-5 text-sm text-slate-400 font-mono">#{job.id}</td>
                        <td className="px-7 py-5 font-medium text-slate-900">{job.data.to}</td>
                        <td className="px-7 py-5 text-slate-500 text-sm">{new Date(job.timestamp + (job.opts.delay || 0)).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleJobAction(job.id, 'remove')}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Cancel Job"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Failed Jobs (DLQ) Table */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-red-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                <FaExclamationTriangle className="text-red-500" /> Dead Letter Queue (Failed)
              </h3>
              <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">{failedJobs.length}</span>
            </div>
            <div className="p-0 overflow-x-auto max-h-96">
              {failedJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No failed jobs! 🎉</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-400 text-sm font-medium sticky top-0">
                    <tr>
                      <th className="px-7 py-4 border-b border-slate-100 bg-slate-50/30">ID</th>
                      <th className="px-7 py-4 border-b border-slate-100 bg-slate-50/30">Recipient</th>
                      <th className="px-7 py-4 border-b border-slate-100 bg-slate-50/30">Error</th>
                      <th className="px-7 py-4 border-b border-slate-100 bg-slate-50/30 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-slate-600">
                    {failedJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/60 transition-all duration-200 group">
                        <td className="px-7 py-5 text-sm text-slate-400 font-mono">#{job.id}</td>
                        <td className="px-7 py-5 font-medium text-slate-900 text-sm">{job.data.to}</td>
                        <td className="px-7 py-5 text-red-500 text-sm max-w-[200px] truncate" title={job.failedReason}>{job.failedReason}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleJobAction(job.id, 'retry')}
                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors mr-1"
                            title="Retry Job"
                          >
                            <FaRedo />
                          </button>
                          <button
                            onClick={() => handleJobAction(job.id, 'remove')}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Delete Job"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QueueManager;
