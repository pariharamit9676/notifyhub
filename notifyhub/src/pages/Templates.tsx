import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import api from '../api/client';
import Button from '../components/ui/Button';

type Channel = 'email' | 'sms' | 'push';

interface Template {
  _id: string;
  name: string;
  channel: Channel;
  subject: string;
  body: string;
  variables: string[];
  updatedAt: string;
}

const CHANNEL_CONFIG: Record<Channel, { icon: string; color: string; bg: string; border: string }> = {
  email:  { icon: '✉',  color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-100' },
  sms:    { icon: '💬', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  push:   { icon: '🔔', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100' },
};

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<'all' | Channel>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const filteredTemplates = templates.filter(t => filter === 'all' || t.channel === filter);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push' },
  ] as const;

  return (
    <>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Templates</h2>
            <p className="text-sm text-slate-500 mt-0.5">{templates.length} template{templates.length !== 1 ? 's' : ''} total</p>
          </div>
          <Button onClick={() => navigate('/templates/new')} className="flex items-center gap-2">
            <FaPlus /> Create Template
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-100 shadow-sm w-fit">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === opt.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-slate-400 text-sm">Loading templates...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm">{error}</div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => {
              const ch = CHANNEL_CONFIG[template.channel];
              return (
                <div key={template._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="p-5 flex items-start gap-3 border-b border-slate-50">
                    <div className={`w-10 h-10 ${ch.bg} ${ch.border} border rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                      {ch.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{template.name}</h3>
                      <span className={`inline-block mt-1 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${ch.bg} ${ch.color}`}>
                        {template.channel}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 space-y-3">
                    {template.channel === 'email' && template.subject && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Subject</p>
                        <p className="text-sm text-slate-700 truncate">{template.subject}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-2">Variables</p>
                      {template.variables.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {template.variables.map(v => (
                            <span key={v} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono border border-slate-200">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No variables</span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{new Date(template.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/send?template=${template._id}&channel=${template.channel}`}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Use
                      </Link>
                      <Link
                        to={`/templates/edit/${template._id}`}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(template._id, template.name)}
                        disabled={deleting === template._id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        {deleting === template._id ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        ) : (
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📭</div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">No templates found</h3>
            <p className="text-sm text-slate-400 mb-5">Create your first template to get started</p>
            <Link
              to="/templates/create"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl text-sm transition-colors"
            >
              Create Template →
            </Link>
          </div>
        )}

      </div>
    </>
  );
};

export default Templates;
