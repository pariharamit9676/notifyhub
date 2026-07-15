import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FaEnvelope, FaPaperPlane, FaUpload, FaPaste, FaExclamationTriangle, FaMobileAlt } from 'react-icons/fa';
import { generateToken, onMessageListener } from '../config/firebase';
import api from '../api/client';
import Button from '../components/ui/Button';

type Channel = 'email' | 'sms' | 'push';
type Priority = 'high' | 'medium' | 'low';
type SendMode = 'single' | 'bulk';
type BulkInputMethod = 'upload' | 'paste';

const CHANNEL_COSTS = {
  email: 0.0001,
  sms: 0.0075,
  push: 0.0000,
};

interface ParsedRow {
  recipient: string;
  [key: string]: string;
}

const SendNotification: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialChannel = (queryParams.get('channel') as Channel) || 'email';
  const initialTemplate = queryParams.get('template') || '';

  const [sendMode, setSendMode] = useState<SendMode>('single');
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  
  // Single Send State
  const [recipient, setRecipient] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  
  // Bulk Send State
  const [bulkInputMethod, setBulkInputMethod] = useState<BulkInputMethod>('paste');
  const [bulkCsvText, setBulkCsvText] = useState('');
  
  // Shared State
  const [template, setTemplate] = useState<string>(initialTemplate);
  const [priority, setPriority] = useState<Priority>('medium');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/templates');
        setDbTemplates(res.data);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  // Listen for foreground push notifications
  useEffect(() => {
    const listenToPush = async () => {
      try {
        const payload: any = await onMessageListener();
        console.log("🔔 Foreground Push Received:", payload);
        alert(`🔔 New Push Notification!\n\nTitle: ${payload?.notification?.title}\nBody: ${payload?.notification?.body}`);
        listenToPush(); // Setup listener again for the next message
      } catch (err) {
        console.error("Foreground push error:", err);
      }
    };
    listenToPush();
  }, []);

  const filteredTemplates = dbTemplates.filter(t => t.channel === channel);
  const selectedTemplate = dbTemplates.find(t => t._id === template);

  useEffect(() => {
    // Only reset template if the currently selected template doesn't match the new channel
    const currentTpl = dbTemplates.find(t => t._id === template);
    if (currentTpl && currentTpl.channel !== channel) {
      setTemplate('');
    }
  }, [channel, dbTemplates, template]);

  // Update CSV sample when template or channel changes
  useEffect(() => {
    if (selectedTemplate) {
      const vars = selectedTemplate.variables || [];
      const header = ['recipient', ...vars].join(',');
      const r1 = channel === 'sms' ? '+919999999999' : channel === 'push' ? 'device_token_1' : 'pariharamit9676@gmail.com';
      setBulkCsvText(`${header}\n${r1},${vars.map((_: any, i: number) => `Sample${i+1}`).join(',')}`);
    } else {
      setBulkCsvText('');
    }
  }, [selectedTemplate, channel]);

  // Reset variables when template changes (for single send)
  useEffect(() => {
    if (selectedTemplate) {
      const initialVars: Record<string, string> = {};
      (selectedTemplate.variables || []).forEach((v: string) => {
        initialVars[v] = '';
      });
      setVariables(initialVars);
    } else {
      setVariables({});
    }
  }, [selectedTemplate]);

  const handleVarChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  // CSV Parsing
  const parsedData = useMemo(() => {
    const lines = bulkCsvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: ParsedRow = { recipient: '' };
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    });
    
    return { headers, rows };
  }, [bulkCsvText]);

  // Bulk Validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^\+?[0-9\s-]{7,15}$/.test(phone);
  
  const validateRecipient = (rec: string) => {
    if (!rec) return false;
    if (channel === 'email') return isValidEmail(rec);
    if (channel === 'sms') return isValidPhone(rec);
    return true; // Push tokens can be anything
  };

  const getMissingHeaders = () => {
    if (!selectedTemplate) return [];
    return (selectedTemplate.variables || []).filter((v: string) => !parsedData.headers.includes(v));
  };
  
  const missingHeaders = getMissingHeaders();
  const hasRecipientHeader = parsedData.headers.includes('recipient');
  const validRowCount = parsedData.rows.filter(r => validateRecipient(r.recipient)).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setBulkCsvText(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getEstimatedCost = (count: number) => {
    return (count * CHANNEL_COSTS[channel]).toFixed(4);
  };

  const handleGetToken = async () => {
    try {
      const token = await generateToken();
      if (token) {
        setRecipient(token);
        setSuccessMsg('✅ Device Token fetched successfully! Now click Send Notification.');
      } else {
        alert('Failed to get token. Did you add the VAPID key in firebase.ts and allow notifications?');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching token.');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendMode === 'bulk' && (!hasRecipientHeader || missingHeaders.length > 0)) {
      return; // prevent submit if invalid
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      let payload: any = {
        channel,
        sendMode,
        priority,
      };

      if (scheduledTime) {
        payload.scheduledTime = scheduledTime;
      }

      if (sendMode === 'single') {
        payload.recipient = recipient;
        payload.subject = getPreviewSubject().replace('Subject: ', '');
        payload.body = getPreviewBody();
      } else {
        // Bulk mode
        payload.bulkData = parsedData.rows.filter(r => validateRecipient(r.recipient)).map(row => {
          let subject = selectedTemplate.subject || '';
          let body = selectedTemplate.body || '';
          (selectedTemplate.variables || []).forEach((k: string) => {
            const displayValue = row[k] || '';
            subject = subject.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), displayValue);
            body = body.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), displayValue);
          });
          return {
            recipient: row.recipient,
            subject,
            body
          };
        });
      }

      const response = await api.post('/notifications/send', payload);
      
      if (response.data.success) {
        if (sendMode === 'bulk') {
          setSuccessMsg(`✅ Bulk jobs dispatched successfully! ID: ${response.data.jobId}`);
        } else {
          setSuccessMsg(`✅ Notification sent! ID: ${response.data.messageId || response.data.jobId}`);
        }
        
        // Reset form
        setRecipient('');
        setScheduledTime('');
      } else {
        setErrorMsg(response.data.message || 'Failed to send notification.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error occurred while sending.');
    } finally {
      setLoading(false);
    }
  };

  const getRecipientPlaceholder = () => {
    if (channel === 'email') return 'john@example.com';
    if (channel === 'sms') return '+1 (555) 123-4567';
    return 'device_token_xyz123';
  };

  const getPreviewBody = () => {
    if (!selectedTemplate) return 'Select a template to see preview.';
    let body = selectedTemplate.body || '';
    
    if (sendMode === 'bulk' && parsedData.rows.length > 0) {
      const firstRow = parsedData.rows[0];
      (selectedTemplate.variables || []).forEach((k: string) => {
        const displayValue = firstRow[k] || `{{${k}}}`;
        body = body.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), displayValue);
      });
    } else {
      Object.entries(variables).forEach(([k, v]) => {
        const displayValue = v || `{{${k}}}`;
        body = body.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), displayValue);
      });
    }
    return body;
  };

  const getPreviewSubject = () => {
    if (!selectedTemplate) return '';
    if (channel !== 'email') {
      return channel === 'sms' ? 'SMS Preview' : 'Push Preview';
    }
    let sub = selectedTemplate.subject || '';
    
    if (sendMode === 'bulk' && parsedData.rows.length > 0) {
      const firstRow = parsedData.rows[0];
      (selectedTemplate.variables || []).forEach((k: string) => {
        const displayValue = firstRow[k] || `{{${k}}}`;
        sub = sub.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), displayValue);
      });
    } else {
      Object.entries(variables).forEach(([k, v]) => {
        const displayValue = v || `{{${k}}}`;
        sub = sub.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), displayValue);
      });
    }
    return `Subject: ${sub}`;
  };

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ── Form Panel ── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">

          {/* Panel Header */}
          <div className="p-6 border-b border-slate-100">
            {/* Mode Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit mb-5">
              {(['single', 'bulk'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSendMode(mode)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    sendMode === mode
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode === 'single' ? '✏️ Single Send' : '👥 Bulk Send'}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              {sendMode === 'single' ? 'Send a personalised notification to a single recipient.' : 'Send to multiple recipients at once via CSV data.'}
            </p>
          </div>

          <form onSubmit={handleSend} className="p-6 space-y-6 flex-1 flex flex-col">

            {/* Channel Selection */}
            <div>
              <label className="label">Channel</label>
              <div className="flex gap-3">
                {/* Email */}
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                    channel === 'email'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  ✉️ Email
                </button>

                {/* SMS — Coming Soon */}
                <div className="flex-1 relative">
                  <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-300 text-sm font-semibold cursor-not-allowed bg-slate-50 select-none">
                    💬 SMS
                  </div>
                  <span className="absolute -top-2 -right-1 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                    Soon
                  </span>
                </div>

                {/* Push */}
                <button
                  type="button"
                  onClick={() => setChannel('push')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                    channel === 'push'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  🔔 Push
                </button>
              </div>
            </div>

            {/* Template */}
            <div>
              <label className="label" htmlFor="template">Template</label>
              <select
                id="template"
                required
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="input bg-white"
              >
                <option value="" disabled>Select a template...</option>
                {filteredTemplates.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
              {filteredTemplates.length === 0 && (
                <p className="text-xs text-amber-600 mt-1.5">No templates for {channel}. <a href="/templates/create" className="underline font-medium">Create one →</a></p>
              )}
            </div>

            {/* Recipients */}
            {sendMode === 'single' ? (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label" htmlFor="recipient">Recipient</label>
                    {channel === 'push' && (
                      <button
                        type="button"
                        onClick={handleGetToken}
                        className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors mb-2"
                      >
                        <FaMobileAlt /> Get My Browser Token
                      </button>
                    )}
                  </div>
                  <input
                    id="recipient"
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={getRecipientPlaceholder()}
                    className="input"
                  />
                </div>

                {selectedTemplate && (selectedTemplate.variables || []).length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">V</span>
                      Template Variables
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(selectedTemplate.variables || []).map((v: string) => (
                        <div key={v}>
                          <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">{v.replace('_', ' ')}</label>
                          <input
                            type="text"
                            required
                            value={variables[v] || ''}
                            onChange={(e) => handleVarChange(v, e.target.value)}
                            placeholder={`Enter ${v.replace('_', ' ')}`}
                            className="input text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {/* CSV Input Toggle */}
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Recipients Data (CSV)</label>
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <button type="button" onClick={() => setBulkInputMethod('upload')}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                        bulkInputMethod === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}>
                      <FaUpload size={10} /> Upload CSV
                    </button>
                    <button type="button" onClick={() => setBulkInputMethod('paste')}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                        bulkInputMethod === 'paste' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}>
                      <FaPaste size={10} /> Paste Data
                    </button>
                  </div>
                </div>

                {bulkInputMethod === 'upload' ? (
                  <label className="cursor-pointer block">
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/30 text-center transition-all">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-xl flex items-center justify-center mb-3 text-xl">
                        <FaUpload />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">Click to upload CSV file</p>
                      <p className="text-xs text-slate-400">CSV files only, any size</p>
                    </div>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                ) : (
                  <div>
                    <textarea
                      required
                      rows={7}
                      value={bulkCsvText}
                      onChange={(e) => setBulkCsvText(e.target.value)}
                      placeholder={selectedTemplate ? ['recipient', ...(selectedTemplate.variables || [])].join(',') + '\n...' : 'recipient,var1,var2'}
                      className="input resize-none font-mono text-sm leading-relaxed"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                      First row must be headers including <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">recipient</code>
                      {selectedTemplate && (selectedTemplate.variables || []).length > 0 && (
                        <span> · Required: <span className="font-semibold text-slate-600">{(selectedTemplate.variables || []).join(', ')}</span></span>
                      )}
                    </p>
                  </div>
                )}

                {/* Validation + Preview Table */}
                {parsedData.headers.length > 0 && (
                  <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        {parsedData.rows.length} recipient{parsedData.rows.length !== 1 ? 's' : ''} loaded
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${validRowCount === parsedData.rows.length ? 'badge-green' : 'badge-yellow'}`}>
                        {validRowCount} valid
                      </span>
                    </div>

                    {!hasRecipientHeader && (
                      <div className="px-4 py-2.5 bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2 border-b border-red-100">
                        <FaExclamationTriangle /> Missing required header: 'recipient'
                      </div>
                    )}
                    {missingHeaders.length > 0 && hasRecipientHeader && (
                      <div className="px-4 py-2.5 bg-amber-50 text-amber-700 text-xs font-medium flex items-center gap-2 border-b border-amber-100">
                        <FaExclamationTriangle /> Missing headers for template: {missingHeaders.join(', ')}
                      </div>
                    )}

                    <div className="overflow-x-auto max-h-44">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                          <tr>
                            {parsedData.headers.map((h, i) => (
                              <th key={i} className={`px-4 py-2.5 font-semibold uppercase tracking-wide text-slate-500 ${h === 'recipient' ? 'text-indigo-600' : ''}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {parsedData.rows.slice(0, 5).map((row, i) => {
                            const isValid = validateRecipient(row.recipient);
                            return (
                              <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                {parsedData.headers.map((h, j) => (
                                  <td key={j} className={`px-4 py-2 truncate max-w-[150px] ${h === 'recipient' && !isValid ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                                    {row[h]}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {parsedData.rows.length > 5 && (
                        <p className="text-xs text-center text-slate-400 py-2 bg-white border-t border-slate-50">
                          +{parsedData.rows.length - 5} more rows
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Priority + Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Priority</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold uppercase tracking-wide transition-all ${
                        priority === p
                          ? p === 'high' ? 'bg-red-100 border-red-300 text-red-700'
                            : p === 'medium' ? 'bg-amber-100 border-amber-300 text-amber-700'
                            : 'bg-slate-100 border-slate-300 text-slate-600'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'} {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Schedule For <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 mt-auto space-y-3">
              {sendMode === 'bulk' && parsedData.rows.length > 0 && (
                <div className="p-3.5 bg-amber-50 text-amber-800 text-sm rounded-xl border border-amber-200 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>Will send to <strong>{parsedData.rows.length}</strong> recipients. Est. cost: <strong>${getEstimatedCost(parsedData.rows.length)}</strong></span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-xl border border-emerald-200">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                isLoading={loading}
                disabled={loading}
                className="w-full"
              >
                <FaPaperPlane className="mr-2" />
                {sendMode === 'single' ? 'Send Notification' : `Send to ${parsedData.rows.length || 'All'} Recipients`}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Preview Panel ── */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <span>👁</span>
                {sendMode === 'bulk' && parsedData.rows.length > 0 ? 'Preview (1st Row)' : 'Live Preview'}
              </h3>
              <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold uppercase tracking-wide">
                {channel}
              </span>
            </div>

            <div className="p-5">
              {template ? (
                <div className="space-y-4">
                  {channel === 'email' ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      {/* Email Header Mockup */}
                      <div className="bg-slate-50/80 border-b border-slate-200 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                            N
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">NotifyHub</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              to {sendMode === 'bulk' && parsedData.rows.length > 0 ? parsedData.rows[0].recipient : (recipient || 'recipient@example.com')}
                            </p>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-base">
                          {getPreviewSubject().replace('Subject: ', '')}
                        </h4>
                      </div>
                      {/* Email Body Mockup */}
                      <div className="p-5 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed min-h-[160px] bg-white">
                        {getPreviewBody()}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="pb-4 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                          {channel === 'sms' ? 'SMS Preview' : 'Push Notification'}
                        </p>
                        <p className="text-sm font-semibold text-slate-800">{getPreviewSubject()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Message Body</p>
                        <div className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed min-h-[160px] font-sans">
                          {getPreviewBody()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-64 text-slate-300 gap-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center shadow-sm">
                    <FaEnvelope className="text-2xl text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">No template selected</p>
                    <p className="text-xs text-slate-400 mt-1">Select a template from the dropdown to view its preview.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default SendNotification;
