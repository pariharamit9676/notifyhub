import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaSave, FaTimes, FaCheckCircle, FaEye, FaEyeSlash, FaShieldAlt, FaUser, FaBell, FaServer } from 'react-icons/fa';
import api from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Settings: React.FC = () => {
  // Profile State
  const [profile, setProfile] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password State
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/settings/profile');
        if (res.data) {
          setProfile(res.data);
          setNameInput(res.data.name);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    fetchProfile();
  }, []);

  const getInitials = (name: string) =>
    name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handleSaveName = async () => {
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await api.put('/settings/profile', { name: nameInput });
      setProfile(res.data.user);
      setEditingName(false);
      setProfileMsg({ type: 'success', text: '✅ Name updated successfully!' });
    } catch {
      setProfileMsg({ type: 'error', text: '❌ Failed to update name.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: '❌ New passwords do not match.' });
      return;
    }
    setPwLoading(true);
    try {
      await api.put('/settings/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ type: 'success', text: '✅ Password changed successfully!' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPwForm(false);
    } catch (err: any) {
      setPwMsg({ type: 'error', text: `❌ ${err.response?.data?.message || 'Failed to change password.'}` });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* 1. Profile Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center">
            <FaUser className="mr-2 text-indigo-500" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Profile</h2>
              <p className="text-xs text-gray-500">Manage your personal information.</p>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow-sm">
                {profile ? getInitials(profile.name) : '?'}
              </div>
              <div className="flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="px-3 py-1.5 border border-indigo-300 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-400 outline-none"
                      autoFocus
                    />
                    <button onClick={handleSaveName} disabled={profileLoading}
                      className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50">
                      <FaSave className="mr-1" /> Save
                    </button>
                    <button onClick={() => { setEditingName(false); setNameInput(profile?.name || ''); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{profile?.name || '...'}</h3>
                    <button onClick={() => setEditingName(true)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors" title="Edit name">
                      <FaEdit size={14} />
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500">{profile?.email || '...'}</p>
              </div>
            </div>
            {profileMsg && <div className={`text-sm px-4 py-2 rounded-lg ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{profileMsg.text}</div>}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center">Sign out of account</button>
            </div>
          </div>
        </section>

        {/* 2. Change Password */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center">
              <FaShieldAlt className="mr-2 text-indigo-500" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Security</h2>
                <p className="text-xs text-gray-500">Change your password.</p>
              </div>
            </div>
            <button onClick={() => { setShowPwForm(!showPwForm); setPwMsg(null); }} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">{showPwForm ? 'Cancel' : 'Change Password'}</button>
          </div>
          {showPwForm && (
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  required
                />
                <button type="button" className="absolute right-3 top-9 text-slate-400 hover:text-slate-600" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                  {showCurrentPw ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                />
                <button type="button" className="absolute right-3 top-9 text-slate-400 hover:text-slate-600" onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
              />
              {confirmPw && confirmPw !== newPw && <p className="text-xs text-red-500 -mt-2">Passwords do not match</p>}

              {pwMsg && <div className={`text-sm px-4 py-2 rounded-lg ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{pwMsg.text}</div>}

              <Button
                type="submit"
                disabled={pwLoading || (!!confirmPw && confirmPw !== newPw)}
                isLoading={pwLoading}
                className="w-full"
              >
                Update Password
              </Button>
            </form>
          )}
          {!showPwForm && (
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500">Use a strong password to keep your account secure.</p>
            </div>
          )}
        </section>

        {/* 4. System Info */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center">
            <FaServer className="mr-2 text-indigo-500" />
            <div>
              <h2 className="text-base font-bold text-gray-900">System Info</h2>
              <p className="text-xs text-gray-500">Active services and infrastructure overview.</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Email Provider', value: 'SendGrid + MailBuster', status: 'active', note: 'Circuit Breaker: Enabled' },
              { name: 'Queue System', value: 'BullMQ + Redis', status: 'active', note: 'Concurrency: 5 workers' },
              { name: 'Database', value: 'MongoDB Atlas', status: 'active', note: 'Connected' },
              { name: 'WebSocket Server', value: 'Socket.IO', status: 'active', note: 'Real-time events enabled' },
              { name: 'Webhook Security', value: 'SendGrid Signature', status: 'active', note: 'Signature verification ON' },
              { name: 'Unsubscribe System', value: 'CAN-SPAM Compliant', status: 'active', note: 'Auto-drop on unsub' },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.value}</p>
                  <p className="text-xs text-indigo-500 mt-0.5">{item.note}</p>
                </div>
                <span className="flex items-center text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                  <FaCheckCircle className="mr-1" /> Active
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Danger Zone */}
        <section className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
          <div className="p-5 border-b border-red-100 bg-red-50 flex items-center">
            <FaBell className="mr-2 text-red-500" />
            <div>
              <h2 className="text-base font-bold text-red-700">Danger Zone</h2>
              <p className="text-xs text-red-500">Irreversible account actions.</p>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Delete Account</p>
              <p className="text-xs text-gray-500">Permanently delete your account and all associated data.</p>
            </div>
            <button
              onClick={() => alert('This feature is disabled in the demo.')}
              className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
            >
              Delete Account
            </button>
          </div>
        </section>

      </div>
    </>
  );
};

export default Settings;
