import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaPlus } from 'react-icons/fa';
import api from '../api/client';

type Channel = 'email' | 'sms' | 'push';

const sampleData: Record<string, string> = {
  name: 'Rahul',
  order_id: 'ORD-12345',
  amount: '₹2,499'
};

const TemplateCreate: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [newVar, setNewVar] = useState('');

  // Auto-detect variables from body
  useEffect(() => {
    const regex = /{{([^}]+)}}/g;
    const matches = Array.from(body.matchAll(regex)).map(m => m[1].trim());
    
    if (matches.length > 0) {
      setVariables(prev => {
        const updated = [...prev];
        matches.forEach(m => {
          if (m && !updated.includes(m)) {
            updated.push(m);
          }
        });
        return updated;
      });
    }
  }, [body]);

  const handleAddVariable = () => {
    const v = newVar.trim();
    if (v && !variables.includes(v)) {
      setVariables([...variables, v]);
    }
    setNewVar('');
  };

  const handleRemoveVariable = (v: string) => {
    setVariables(variables.filter(vari => vari !== v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/templates', {
        name,
        channel,
        subject: subject || 'No Subject',
        body,
        variables
      });
      navigate('/templates');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create template.');
    }
  };

  const getPreviewBody = () => {
    if (!body) return 'Enter template body to see preview...';
    return body.replace(/{{([^}]+)}}/g, (match, key) => {
      return sampleData[key.trim()] || `<span class="bg-yellow-100 text-yellow-800 px-1 rounded">${match}</span>`;
    });
  };

  const getPreviewSubject = () => {
    if (channel !== 'email') {
      return channel === 'sms' ? 'SMS Preview' : 'Push Preview';
    }
    if (!subject) return 'Enter subject...';
    return subject.replace(/{{([^}]+)}}/g, (match, key) => {
      return sampleData[key.trim()] || match;
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Template Details</h2>
            <p className="text-sm text-gray-500">Create a new message template.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                Template Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., order_confirmation"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
              <div className="flex space-x-3">
                {(['email', 'sms', 'push'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChannel(c)}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg border font-medium text-sm transition-colors ${
                      channel === c
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2 text-base">
                      {c === 'email' ? '📧' : c === 'sms' ? '✉️' : '📱'}
                    </span> 
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject (Email Only) */}
            {channel === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="subject">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Order #{{order_id}} Confirmed"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            )}

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="body">
                Message Body
              </label>
              <textarea
                id="body"
                required
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Hi {{name}},\n\nYour order {{order_id}} is confirmed!`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all font-mono text-sm leading-relaxed"
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">
                Use <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600">{'{{variable_name}}'}</code> to insert dynamic data.
              </p>
            </div>

            {/* Variables List */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-3">Variables</label>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {variables.length > 0 ? (
                  variables.map(v => (
                    <div key={v} className="flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-mono border border-indigo-200">
                      {`{{${v}}}`}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVariable(v)}
                        className="ml-2 text-indigo-500 hover:text-indigo-800 focus:outline-none"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">No variables detected yet.</span>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newVar}
                  onChange={(e) => setNewVar(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVariable(); } }}
                  placeholder="Add new variable (e.g. amount)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddVariable}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" /> Add
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/templates')}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Create Template
              </button>
            </div>

          </form>
        </div>

        {/* Live Preview Section */}
        <div className="h-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center">
                <span className="mr-2">👁️</span> Live Preview
              </h3>
              <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold uppercase">
                {channel}
              </span>
            </div>
            
            <div className="p-5">
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {channel === 'email' ? 'Subject' : 'Heading'}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {getPreviewSubject()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Message Body</p>
                  <div 
                    className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-5 rounded-lg border border-gray-100 leading-relaxed font-sans min-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: getPreviewBody() }}
                  />
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sample Data Used</p>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 font-mono text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(sampleData, null, 2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default TemplateCreate;
