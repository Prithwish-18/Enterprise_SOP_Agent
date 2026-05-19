import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChatContext } from '../context/ChatContext';
import { User, Mail, Key, Lock, ArrowLeft, CheckCircle2, Shield, Activity, Calendar, Clock, LogOut, Edit3, Eye, EyeOff, X, Save, AlertTriangle, ChevronRight, Zap, Phone, Building2, Laptop, Smartphone, Monitor, Wifi, WifiOff, Loader2, Trash2 } from 'lucide-react';
import { updateProfileUser, getActiveSessions, revokeSession } from '../services/api';
import lock from "../assets/lock.png";

const InfoRow = ({ label, value, mono, badge }) => (
  <div className="py-4 flex items-center justify-between gap-4 border-b border-white/5 last:border-0">
    <div>
      <p className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-1">{label}</p>
      <p className={`text-sm text-gray-100 font-medium ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
    {badge && <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0" style={badge.style}>{badge.text}</span>}
  </div>
);

const Tile = ({ icon: Icon, label, value, color }) => (
  <div className="p-4 rounded-2xl flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(99,102,241,0.2)]" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: `1px solid rgba(255,255,255,0.05)`, boxShadow: `inset 0 0 12px ${color}08` }}>
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg" style={{ background: `${color}12` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
    <p className="text-base font-bold text-white leading-tight mt-1">{value}</p>
  </div>
);

const Field = ({ icon: Icon, label, name, value, onChange, type = 'text', placeholder, reveal, onReveal, show, autoFocus, note }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[11px] font-bold tracking-widest text-gray-500 uppercase block">{label}</label>}
    <div className="relative">
      <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus}
        type={reveal ? (show ? 'text' : 'password') : type}
        className="w-full text-sm bg-[#0d1117] border border-white/8 text-gray-100 rounded-xl py-3 pl-10 pr-10 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-gray-700" />
      {reveal && (
        <button type="button" onClick={onReveal} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
    {note && <p className="text-[11px] text-gray-600 pl-1">{note}</p>}
  </div>
);

const Modal = ({ title, subtitle, icon: Icon, iconNode, color = '#6366f1', onClose, children }) => createPortal(  <div className="fixed inset-0 z-2000 flex items-center justify-center p-4" style={{ background: 'rgba(2,4,14,0.88)', backdropFilter: 'blur(20px)' }}>
    <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-fade-in" style={{ background: 'linear-gradient(160deg,#111827,#080d1a)', border: `1px solid ${color}28` }}>
      <div className="h-3px" style={{ background: `linear-gradient(90deg,${color},${color}60)` }} />
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
              {iconNode ? iconNode : <Icon size={18} style={{ color }} />}
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-600 hover:text-white hover:bg-white/6 transition-all"><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  </div>,
  document.body
);

const Btn = ({ children, variant = 'primary', color, loading, ...rest }) => {
  const base = 'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all';
  const styles = {
    primary: { background: color || 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: '#fff', boxShadow: '0 4px 14px rgba(79,70,229,0.25)' },
    ghost: { background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.07)' },
  };
  return (
    <button className={base} style={styles[variant]} {...rest}>
      {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : children}
    </button>
  );
};

const ProfilePage = () => {
  const { userEmail, authToken, login, apiKey, saveApiKey, sessions, logout } = useContext(ChatContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: localStorage.getItem('opsmind_user_name') || '',
    phone: localStorage.getItem('opsmind_user_phone') || '',
    department: localStorage.getItem('opsmind_user_dept') || '',
    api_key: apiKey || ''
  });
  const [draft, setDraft] = useState({ ...profile });
  const [pass, setPass] = useState({ old: '', newP: '', confirm: '' });
  const [showPass, setShowPass] = useState({ old: false, newP: false, confirm: false });
  const [modals, setModals] = useState({ edit: false, password: false });
  const [toast, setToast] = useState('');
  const [err, setErr] = useState({ edit: '', pass: '', key: '' });
  const [saving, setSaving] = useState(false);
  const joinDate = localStorage.getItem('opsmind_join_date') || new Date().toISOString().split('T')[0];
  const lastPassChange = localStorage.getItem('opsmind_pass_changed') || null;
  useEffect(() => {
    if (!localStorage.getItem('opsmind_join_date')) localStorage.setItem('opsmind_join_date', joinDate);
  }, []);
  const sessionCount = sessions?.length || 0;
  const lastActive = sessionCount > 0 ? new Date(sessions[0]?.updatedAt || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—';
  const initials = (profile.name || userEmail || 'U').slice(0, 2).toUpperCase();

  const deviceInfo = useMemo(() => {
    const ua = navigator.userAgent;
    let os = 'Unknown'; if (/Windows/.test(ua)) os='Windows'; else if (/Mac OS X/.test(ua)) os='macOS'; else if (/Android/.test(ua)) os='Android'; else if (/iPhone|iPad/.test(ua)) os='iOS'; else if (/Linux/.test(ua)) os='Linux';
    let browser = 'Unknown'; if (/Edg\//.test(ua)) browser='Edge'; else if (/Chrome\//.test(ua)&&!/Chromium/.test(ua)) browser='Chrome'; else if (/Firefox\//.test(ua)) browser='Firefox'; else if (/Safari\//.test(ua)) browser='Safari';
    let deviceType = 'PC'; if (/Mobi|Android/.test(ua)&&!/Tablet|iPad/.test(ua)) deviceType='Mobile'; else if (/Tablet|iPad/.test(ua)) deviceType='Tablet';
    return { os, browser, deviceType };
  }, []);

  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  const fetchSessions = useCallback(async () => {
    if (!authToken) return;
    setSessionsLoading(true);
    try {
      const data = await getActiveSessions(authToken);
      setActiveSessions(data);
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    } finally {
      setSessionsLoading(false);
    }
  }, [authToken]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleRevoke = async (sessionId) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId, authToken);
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (e) { console.error(e); }
    finally { setRevokingId(null); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const openModal = (key) => {
    setErr({ edit: '', pass: '', key: '' });
    setModals(m => ({ ...m, [key]: true }));
    if (key === 'edit') setDraft({ ...profile });
    if (key === 'password') setPass({ old: '', newP: '', confirm: '' });
  };
  const closeModal = (key) => {
    setModals(m => ({ ...m, [key]: false }));
    if (key === 'password') setPass({ old: '', newP: '', confirm: '' });
  };

  const saveProfile = async (e) => {
    e.preventDefault(); setErr(p => ({ ...p, edit: '' })); setSaving(true);
    try {
      await updateProfileUser(draft.name, undefined, undefined, draft.api_key, authToken);
      localStorage.setItem('opsmind_user_name', draft.name);
      localStorage.setItem('opsmind_user_phone', draft.phone || '');
      localStorage.setItem('opsmind_user_dept', draft.department || '');
      setProfile({ ...draft });
      closeModal('edit');
      showToast('Profile updated');
    } catch (e) { setErr(p => ({ ...p, edit: e.message || 'Failed to save' })); }
    finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault(); setErr(p => ({ ...p, pass: '' }));
    if (pass.newP !== pass.confirm) return setErr(p => ({ ...p, pass: 'Passwords do not match.' }));
    if (pass.newP.length < 6) return setErr(p => ({ ...p, pass: 'Enter Minimum 8 characters' }));
    setSaving(true);
    try {
      await updateProfileUser(profile.name, pass.old, pass.newP, profile.api_key, authToken);
      localStorage.setItem('opsmind_pass_changed', new Date().toISOString());
      closeModal('password'); showToast('Password changed');
    } catch (e) { setErr(p => ({ ...p, pass: e.message || 'Failed to change password' })); }
    finally { setSaving(false); }
  };

  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: 'linear-gradient(180deg,#070a14,#050810)' }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-500px h-400px opacity-10" style={{ background: 'radial-gradient(ellipse,#6366f1,transparent 65%)' }} />
        <div className="absolute bottom-0 left-0 w-400px h-300px opacity-6" style={{ background: 'radial-gradient(ellipse,#3b82f6,transparent 65%)' }} />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-3000 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-medium text-emerald-300 shadow-2xl"
             style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', backdropFilter: 'blur(16px)' }}>
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-16 sm:pb-24 space-y-3 sm:space-y-4">

        <button onClick={() => navigate('/chat')} className="py-1.5 px-2 flex items-center gap-1.5 text-xs font-medium border border-gray-500 rounded-2xl text-gray-600 hover:text-gray-300 transition-colors">
          <ArrowLeft size={13} /> Back to Chat
        </button>

        <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="h-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#1e3a5f 100%)' }}>
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 15% 60%, rgba(99,102,241,0.55) 0%, transparent 55%), radial-gradient(circle at 85% 15%, rgba(59,130,246,0.45) 0%, transparent 50%), radial-gradient(circle at 55% 100%, rgba(139,92,246,0.3) 0%, transparent 50%)' }} />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="absolute inset-0 flex items-center overflow-hidden select-none px-6" aria-hidden="true">
              <span
                className="whitespace-nowrap font-black uppercase leading-none truncate w-full"
                style={{fontSize: (profile.name || userEmail || '').length > 12 ? 'clamp(1.8rem, 5vw, 3.2rem)' : 'clamp(2.5rem, 8vw, 4.5rem)',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(165,180,252,0.28) 40%, rgba(96,165,250,0.18) 80%, rgba(255,255,255,0.08) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 18px rgba(99,102,241,0.45))',
                  letterSpacing: '0.15em',}}>
                {(profile.name || userEmail || 'OpsMind').toUpperCase()}
              </span>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-10" style={{ background: 'linear-gradient(to top, #0f0d26, transparent)' }} />
          </div>
          <div className="px-6 pb-6" style={{ background: 'linear-gradient(180deg,#0f0d26,#090d1f)' }}>
            <div className="flex items-end justify-between -mt-10 mb-5 relative z-10">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white ring-[3px] ring-[#090d1f]"
                   style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 32px rgba(99,102,241,0.5)' }}>
                {initials}
              </div>
              <button onClick={() => openModal('edit')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all hover:brightness-125"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                <Edit3 size={12} /> EDIT PROFILE
              </button>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">{profile.name || 'No name set'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">● Active</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Tile icon={Activity} label="Total Chats" value={`${sessionCount} total`} color="#3b82f6" />
          <Tile icon={Clock} label="Last active on" value={lastActive} color="#8b5cf6" />
          <Tile icon={Calendar} label="Joined on" value={new Date(joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} color="#10b981" />
          <Tile icon={Building2} label="Department" value={profile.department || 'Not set'} color="#f59e0b" />
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(145deg,#0f0d26,#090d1f)' }}>
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">Account</p>
          </div>
          <div className="px-5">
            <InfoRow label="Full Name" value={profile.name || '—'} />
            <InfoRow label="Email Address" value={userEmail} badge={{ text: 'Verified', style: { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' } }} />
            <InfoRow label="Phone" value={profile.phone || 'Not provided'} />
            <InfoRow label="Department" value={profile.department || 'Not set'} />
            <InfoRow label="Member Since" value={new Date(joinDate).toLocaleDateString('en-US', { dateStyle: 'long' })} />
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(145deg,#0f0d26,#090d1f)' }}>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-500">Security</p>
          </div>
          {/* Mobile: tap whole row */}
          <button onClick={() => openModal('password')} className="sm:hidden w-full flex items-center justify-between px-4 py-4 hover:bg-white/3 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Lock size={14} className="text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-100">Password</p>
                <p className="text-xs text-gray-600">
                  {lastPassChange ? `Last changed ${new Date(lastPassChange).toLocaleDateString('en-US', { dateStyle: 'medium' })}` : 'Never changed — update recommended'}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-700" />
          </button>
          <div className="hidden sm:flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Lock size={15} className="text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-100">Password</p>
                <p className="text-xs text-gray-600">
                  {lastPassChange ? `Last changed ${new Date(lastPassChange).toLocaleDateString('en-US', { dateStyle: 'medium' })}` : 'Never changed — update recommended'}
                </p>
              </div>
            </div>
            <button onClick={() => openModal('password')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all hover:brightness-125"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              Change
            </button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(145deg,#0f0d26,#090d1f)' }}>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-500">Currently Logged In Devices</p>
            <div className="flex items-center gap-2">
              {!sessionsLoading && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                  {activeSessions.length} active
                </span>
              )}
              <button onClick={fetchSessions} title="Refresh"
                className="rounded-lg text-gray-400 hover:text-white transition-colors p-1">
                {sessionsLoading ? <Loader2 size={12} className="animate-spin text-indigo-400" /> : <span className="text-lg">↻</span>}
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            {sessionsLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-4 justify-center">
                <Loader2 size={14} className="animate-spin" /> Loading active devices...
              </div>
            ) : activeSessions.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">No active sessions found</p>
            ) : (
              activeSessions.map((device) => {
                const DeviceIcon = device.deviceType === 'Mobile' ? Smartphone : device.deviceType === 'Tablet' ? Monitor : Laptop;
                const accentColor = device.isCurrent ? '#10b981' : device.isOnline ? '#6366f1' : '#6b7280';
                const lastSeenStr = device.isOnline
                  ? 'Active right now'
                  : `Last seen ${new Date(device.lastSeen).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                return (
                  <div key={device.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl border relative overflow-hidden transition-all hover:scale-[1.01] duration-300"
                    style={{ borderColor: device.isCurrent ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)', background: device.isCurrent ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)' }}>
                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl animate-pulse" style={{ background: accentColor }} />
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
                        <DeviceIcon size={15} style={{ color: accentColor }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-100 flex flex-wrap items-center gap-1.5">
                          {device.os} · {device.deviceType}
                          {device.isCurrent && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase font-bold tracking-wider border border-emerald-500/30">Your Device</span>
                          )}
                          {device.isOnline && !device.isCurrent && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 uppercase font-bold border border-indigo-500/30">Online</span>
                          )}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">
                          {device.browser} • {lastSeenStr}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl px-5 py-5" style={{ border: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.03)' }}>
          <div className="flex items-center gap-2 mb-1">
            {/* <AlertTriangle size={12} className="text-red-600" />
            <p className="text-[11px] font-black uppercase tracking-widest text-red-700">Danger Zone</p> */}
          </div>
          <button onClick={() => { if (window.confirm('Sign out of OpsMind AI?')) logout(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 border border-red-500/15 hover:bg-red-500/8 transition-all">
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>

      {modals.edit && (
        <Modal title="Edit Profile" subtitle="Update your personal information" icon={User} color="#6366f1" onClose={() => closeModal('edit')}>
          <form onSubmit={saveProfile} className="space-y-4">
            {err.edit && <div className="flex items-center gap-2 p-3 rounded-xl text-red-300 text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}><AlertTriangle size={13} />{err.edit}</div>}
            <Field icon={User} label="Full Name" name="name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Your full name" autoFocus />
            <div className="py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">Email</p>
              <p className="text-sm text-gray-400 font-medium">{userEmail}</p>
              <p className="text-[10px] text-gray-700 mt-0.5">Email cannot be changed here. Contact admin.</p>
            </div>
            <Field icon={Phone} label="Phone Number" name="phone" value={draft.phone || ''} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            <Field icon={Building2} label="Department" name="department" value={draft.department || ''} onChange={e => setDraft(d => ({ ...d, department: e.target.value }))} placeholder="e.g. Engineering, Sales" />
            <div className="flex gap-3 pt-2">
              <Btn variant="ghost" type="button" onClick={() => closeModal('edit')}>Cancel</Btn>
              <Btn loading={saving} type="submit"><Save size={20} />Save</Btn>
            </div>
          </form>
        </Modal>
      )}

      {modals.password && (
        <Modal title="Change Password" subtitle="Entering wrong current password will logout you immediately"
          iconNode={<img src={lock} className="h-20 w-20 object-contain" />}
          color="#8b5cf6" onClose={() => closeModal('password')}>          <form onSubmit={savePassword} className="space-y-4">
            {err.pass && <div className="flex items-center gap-2 p-3 rounded-xl text-red-300 text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}><AlertTriangle size={13} />{err.pass}</div>}
            <Field icon={Lock} label="Current Password" name="old" value={pass.old} onChange={e => setPass(p => ({ ...p, old: e.target.value }))} placeholder="Enter current password" reveal onReveal={() => setShowPass(s => ({ ...s, old: !s.old }))} show={showPass.old} autoFocus />
            <Field icon={Lock} label="New Password" name="newP" value={pass.newP} onChange={e => setPass(p => ({ ...p, newP: e.target.value }))} placeholder="Minimum 8 characters" reveal onReveal={() => setShowPass(s => ({ ...s, newP: !s.newP }))} show={showPass.newP} />
            <Field icon={Lock} label="Confirm New Password" name="confirm" value={pass.confirm} onChange={e => setPass(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter new password" reveal onReveal={() => setShowPass(s => ({ ...s, confirm: !s.confirm }))} show={showPass.confirm} />
            <div className="flex gap-3 pt-2">
              <Btn variant="ghost" type="button" onClick={() => closeModal('password')}>Cancel</Btn>
              <Btn loading={saving} type="submit" color="linear-gradient(135deg,#7c3aed,#4f46e5)"><Lock size={17} />Update</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;
