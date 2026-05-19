import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChatProvider, ChatContext } from './context/ChatContext';
import { useContext, useState, useEffect, useRef } from 'react';
import ChatPage from './pages/ChatPage';
import PrivateChatPage from './pages/PrivateChatPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import SharedChatPage from './pages/SharedChatPage';
import ArchivedChatsModal from './components/ArchivedChatsModal';
import { Menu, X, MessageSquare, Upload, LogOut, User, Settings, Shield, Eye, EyeOff, Archive, Trash2, Database, Lock, Beaker, Zap, Key, Save } from 'lucide-react';
import { deleteAllDocumentsApi, deletePrivateDocumentsApi } from './services/api';
import privateLogo from './assets/protected_logo.png';
import privateChat from './assets/private_chat.png';
import shield from './assets/shield.png';

const ProtectedRoute = ({ children }) => {
  const { userEmail } = useContext(ChatContext);
  const location = useLocation();
  if (!userEmail) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const HomeRoute = () => {
  const { userEmail, isPrivateMode } = useContext(ChatContext);
  if (!userEmail) return <LandingPage />;
  return isPrivateMode ? <PrivateChatPage /> : <ChatPage />;
};

const NavBar = () => {
  const { userEmail, logout, isPrivateMode, setIsPrivateMode, setPrivateMessages, masked, setMasked, clearAllSessions, authToken, sessions, setLockPassword, deleteSession, switchSession, isDeepResearch, setIsDeepResearch, apiKey, saveApiKey, archivedIds, unarchiveSession } = useContext(ChatContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [archivedModalOpen, setArchivedModalOpen] = useState(false);
  const [setPasswordModalOpen, setSetPasswordModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [normalLockModalOpen, setNormalLockModalOpen] = useState(false);
  const [normalLockPassword, setNormalLockPassword] = useState(() => localStorage.getItem('opsmind_normal_lock_password') || '');
  const [normalLocked, setNormalLocked] = useState(() => localStorage.getItem('opsmind_normal_locked') === 'true');
  const [normalLockInput, setNormalLockInput] = useState('');
  const [normalLockAttempts, setNormalLockAttempts] = useState(() => parseInt(localStorage.getItem('opsmind_normal_lock_attempts') || '0'));
  const [normalLockError, setNormalLockError] = useState('');

  useEffect(() => {
    localStorage.setItem('opsmind_normal_locked', normalLocked);
  }, [normalLocked]);

  useEffect(() => {
    localStorage.setItem('opsmind_normal_lock_password', normalLockPassword);
  }, [normalLockPassword]);

  useEffect(() => {
    localStorage.setItem('opsmind_normal_lock_attempts', normalLockAttempts);
  }, [normalLockAttempts]);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [showTempKey, setShowTempKey] = useState(false);
  const location = useLocation();

  const hasCustomKey = apiKey && apiKey !== '__USE_SERVER_KEY__';

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    const key = tempKey.trim();
    const finalKey = key || '__USE_SERVER_KEY__';
    saveApiKey(finalKey);
    setApiKeyModalOpen(false);
    alert(key ? 'Your Gemini API key saved' : 'Reverted to server default key');
  };

  const handleExitPrivate = async () => {
    try {
      await deletePrivateDocumentsApi(authToken);
    } catch (e) {
      console.error('Failed to wipe private documents:', e);
    }
    setIsPrivateMode(false);
    setPrivateMessages([]);
  };

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleEyeClick = () => {
    if (!masked) {
      setTempPassword('');
      setSetPasswordModalOpen(true);
    }
  };

  const confirmLock = (e) => {
    e.preventDefault();
    if (tempPassword.trim() === '') return alert('Password cannot be empty');
    setLockPassword(tempPassword);
    setMasked(true);
    setSetPasswordModalOpen(false);
    setTempPassword('');
  };

  const confirmNormalLock = (e) => {
    e.preventDefault();
    if (!normalLockPassword.trim()) return;
    setNormalLocked(true);
    setNormalLockModalOpen(false);
  };

  const handleNormalUnlock = (e) => {
    e.preventDefault();
    if (normalLockInput === normalLockPassword) {
      setNormalLocked(false);
      setNormalLockPassword('');
      setNormalLockInput('');
      setNormalLockAttempts(0);
      setNormalLockError('');
    } else {
      const attempts = normalLockAttempts + 1;
      setNormalLockInput('');
      if (attempts >= 3) {
        alert('Too many failed attempts, Logging out');
        setNormalLocked(false);
        setNormalLockPassword('');
        setNormalLockAttempts(0);
        setNormalLockError('');
        logout();
      } else {
        setNormalLockAttempts(attempts);
        setNormalLockError("Wrong password");
        setTimeout(() => {
          setNormalLockError('');
        }, 1500);
      }
    }
  };

  const handleDeleteAllDocs = async () => {
    if (window.confirm("Are you sure you want to delete ALL documents? This action cannot be undone")) {
      try {
        await deleteAllDocumentsApi(authToken);
        alert("All documents deleted successfully");
        window.dispatchEvent(new Event('documents-cleared'));
      } catch (e) {
        alert("Failed to delete documents: " + e.message);
      }
    }
  };

  const openArchived = () => {
    setSettingsOpen(false);
    setArchivedModalOpen(true);
  };

  const getArchivedChats = () => {
    return sessions.filter(s => archivedIds.includes(s.id));
  };

  const handleUnarchive = (sessionId) => {
    unarchiveSession(sessionId);
  };

  const handleDeleteArchived = (sessionId) => {
    if (window.confirm("Are you sure you want to permanently delete this chat?")) {
      deleteSession(sessionId);
      handleUnarchive(sessionId);
    }
  };

  const handleOpenArchived = (sessionId) => {
    handleUnarchive(sessionId);
    switchSession(sessionId);
    setArchivedModalOpen(false);
    navigate('/chat');
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleOutsideInteraction = (e) => {
      if (!e.target.closest('.nav-bar')) {
        setMobileMenuOpen(false);
      }
    };

    const handleScroll = (e) => {
      if (!e.target.closest?.('.nav-bar')) {
        setMobileMenuOpen(false);
      }
    };

    setTimeout(() => {
      document.addEventListener('pointerdown', handleOutsideInteraction, true); 
      document.addEventListener('scroll', handleScroll, true); 
    }, 0);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideInteraction, true);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [mobileMenuOpen]);

  if (isPrivateMode) {
    return (
      <nav className="nav-bar" style={{ background: 'rgba(15,10,25,0.85)', borderBottom: '1px solid rgba(168,85,247,0.1)' }}>
        <div className="nav-inner">
          <div className="nav-logo">
            <img src={privateLogo} className="h-12 w-12 object-contain"/>
            <span className="font-bold text-lg bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Private Chat
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={handleEyeClick}
              className="p-2 rounded-xl text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/20 transition-all cursor-pointer"
              title="Lock Chat">
              <EyeOff size={16} />
            </button>
            <button onClick={handleExitPrivate} aria-label="Exit Private Chat"
            className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-xl text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 hover:border-purple-500/30 transition-all duration-200 shadow-[0_0_15px_rgba(168,85,247,0.15)] cursor-pointer whitespace-nowrap">
            <X size={15} className="shrink-0" />
            <span>Exit</span>
          </button>
          </div>
        </div>

        {/* Set Password Modal for Private Mode */}
        {setPasswordModalOpen && createPortal(
          <div className="fixed inset-0 z-2000 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col"
                 style={{ background: 'linear-gradient(180deg, rgba(15,10,25,0.95), rgba(10,5,20,0.98))', border: '1px solid rgba(168,85,247,0.2)' }}>
              <div className="flex justify-center items-center mb-3">
                <img src={privateLogo} className="h-20 w-20 object-contain" />
              </div>
              <h2 className="text-xl font-bold text-white text-center mb-2">Lock Screen</h2>
              <p className="text-sm text-gray-400 text-center mb-6">Create a temporary password to lock this session</p>
              <form onSubmit={confirmLock} className="flex flex-col gap-4">
                <input type="password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Enter a password"
                  className="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-center"
                  autoFocus/>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSetPasswordModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">Lock</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </nav>
    );
  }

  return (
    <nav className="nav-bar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <img src="/logo.png" className="h-8 w-8 object-contain"/>
          <span className="nav-logo-text">OpsMind Ai</span>
        </Link>

        {/* Desktop Nav */}
        <div className="nav-links-desktop">
          {userEmail ? (
            <>
              <Link to="/chat" className={`nav-link ${isActive('/chat') || isActive('/') ? 'nav-link-active' : ''}`}>
                <MessageSquare size={16} />
                <span>Chat</span>
              </Link>
              <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'nav-link-active' : ''}`}>
                <Upload size={16} />
                <span>Uploads</span>
              </Link>
              {/*Lock App */}
              <button
                onClick={() => { setNormalLockPassword(''); setNormalLockModalOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                title="Lock Web App">
                <Lock size={15} />Lock App
              </button>
              <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-1 relative" ref={settingsRef}>
                <button 
                  onClick={() => setSettingsOpen(!settingsOpen)} 
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${settingsOpen ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} 
                  title="Settings">
                  <Settings size={16} />
                </button>

                {settingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden shadow-2xl z-100 p-1"
                       style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">All Settings</div>
                    
                    <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left" onClick={() => setSettingsOpen(false)}>
                      <User size={14} /> My Profile
                    </Link>

                    <button onClick={openArchived} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left">
                      <Archive size={14} /> View Archived Chats
                    </button>

                    <button onClick={() => { setSettingsOpen(false); setTempKey(hasCustomKey ? apiKey : ''); setShowTempKey(false); setApiKeyModalOpen(true); }} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left">
                      <Zap size={14} className={hasCustomKey ? "text-amber-400" : ""} />
                      {hasCustomKey ? 'Manage Gemini API Key' : 'Set Gemini API Key'}
                    </button>

                    <div className="my-1 border-t border-white/5" />
                    <button onClick={() => setIsDeepResearch(!isDeepResearch)} className="flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left">
                      <div className="flex items-center gap-2.5">
                        <Beaker size={14} className={isDeepResearch ? "text-blue-400" : ""} /> Deep Research
                      </div>
                      <div className={`w-7 h-3.5 rounded-full p-0.5 transition-colors ${isDeepResearch ? 'bg-blue-500' : 'bg-gray-700'}`}>
                         <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${isDeepResearch ? 'translate-x-3.5' : 'translate-x-0'}`} />
                      </div>
                    </button>
                    <div className="my-1 border-t border-white/5" />
                    <button onClick={() => { setSettingsOpen(false); clearAllSessions(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left">
                      <Trash2 size={14} /> Delete All Chats
                    </button>
                    
                    <button onClick={() => { setSettingsOpen(false); handleDeleteAllDocs(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left">
                      <Database size={14} /> Delete All Documents
                    </button>
                    
                    <div className="my-1 border-t border-white/5" />
                    
                    <button onClick={() => { setSettingsOpen(false); logout(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left">
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" state={{ isLogin: true }} className="px-4 py-2 text-sm rounded-xl font-bold text-gray-300 transition-all flex items-center justify-center gap-2 border border-gray-700 bg-gray-900/50 hover:bg-gray-800 hover:text-white hover:border-gray-600">
                Log In
              </Link>
              <Link to="/login" state={{ isLogin: false }} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navbar Controls */}
        <div className="flex md:hidden items-center gap-2">
          {userEmail && (
            <button
              onClick={() => { setNormalLockPassword(''); setNormalLockModalOpen(true); }}
              className="px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 border border-white/10 flex items-center justify-center gap-1.5 transition-all shadow-sm text-xs font-semibold"
              title="Lock Web App">
              <Lock size={14} /> Lock App
            </button>
          )}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Invisible backdrop to close menu when clicking outside */}
          <div className="fixed inset-0 z-4900 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="md:hidden absolute top-full left-0 right-0 flex flex-col gap-1 px-4 py-2 pb-4 bg-[#0a0e1a]/98 backdrop-blur-md border-b border-white/5 shadow-2xl z-5000 animate-fade-in">
          {userEmail ? (
            <>
              <Link to="/chat" className={`nav-mobile-link ${isActive('/chat') || isActive('/') ? 'nav-link-active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <MessageSquare size={16} /> Chat
              </Link>
              <Link to="/admin" className={`nav-mobile-link ${isActive('/admin') ? 'nav-link-active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <Upload size={16} /> Uploads
              </Link>
              <button onClick={() => { setMobileMenuOpen(false); openArchived(); }} className="nav-mobile-link">
                <Archive size={16} /> Archived Chats
              </button>
              <div className="h-px bg-white/5 my-1"></div>
              <Link to="/profile" className={`nav-mobile-link ${isActive('/profile') ? 'nav-link-active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <User size={16} /> My Profile
              </Link>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="nav-mobile-logout mt-1">
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" state={{ isLogin: true }} className="nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Log In
              </Link>
              <Link to="/login" state={{ isLogin: false }} className="nav-mobile-link text-blue-400 font-semibold" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
        </>
      )}
      <ArchivedChatsModal
        isOpen={archivedModalOpen}
        onClose={() => setArchivedModalOpen(false)}
        archivedChats={getArchivedChats()}
        onUnarchive={handleUnarchive}
        onDelete={handleDeleteArchived}
        onOpen={handleOpenArchived}
      />

      {/* API Key Modal */}
      {apiKeyModalOpen && createPortal(
        <div className="fixed inset-0 z-2000 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col"
               style={{ background: 'linear-gradient(180deg, rgba(15,10,25,0.95), rgba(10,5,20,0.98))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-amber-500/20 border border-amber-500/30">
                <Zap size={24} className="text-amber-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Gemini API Key</h2>
            <p className="text-sm text-gray-400 text-center mb-6">Your key is stored locally and never sent to our servers</p>
            
            <form onSubmit={handleSaveApiKey} className="flex flex-col gap-4">
              <div className="p-3.5 rounded-xl text-xs text-amber-300/80 leading-relaxed" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <strong className="text-amber-300">How it works:</strong> Enter your personal Gemini API key to use your own quota. Leave blank to use the shared server key
              </div>
              
              <div className="relative">
                <input
                  type={showTempKey ? 'text' : 'password'}
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy… (leave blank for server default)"
                  className="w-full bg-black/30 border border-amber-500/30 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                  autoFocus/>
                <Key size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
                <button type="button" onClick={() => setShowTempKey(!showTempKey)} className="absolute right-3.5 top-3.5 text-gray-500 hover:text-white transition-colors">
                  {showTempKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {hasCustomKey && (
                <button type="button" onClick={() => setTempKey('')} className="text-xs text-red-400 hover:text-red-300 transition-colors self-start">
                  × Remove my key (revert to server default)
                </button>
              )}

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setApiKeyModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]" style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#1c1004' }}>
                  <Save size={16} /> {tempKey.trim() ? 'Save My Key' : 'Use Server Default'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Normal Lock — Set Password Modal */}
      {normalLockModalOpen && createPortal(
        <div className="fixed inset-0 z-2000 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col"
               style={{ background: 'linear-gradient(180deg,#0f172a,#0a0f1e)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <div className="flex justify-center items-center mb-3">
                <img src={privateLogo} className="h-20 w-20 object-contain" />
              </div>
            <h2 className="text-xl font-bold text-white text-center mb-1">Lock App</h2>
            <p className="text-sm text-gray-400 text-center mb-6">Set a temporary password to lock the screen</p>
            <form onSubmit={confirmNormalLock} className="flex flex-col gap-4">
              <input type="password" value={normalLockPassword} onChange={e => setNormalLockPassword(e.target.value)}
                placeholder="Enter a password" autoFocus
                className="w-full bg-black/30 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-center" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setNormalLockModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all">Lock</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Normal Lock Screen Overlay */}
      {normalLocked && !isPrivateMode && createPortal(
        <div className="fixed inset-0 z-1500 flex items-center justify-center p-4 backdrop-blur-xl"
             style={{ background: 'radial-gradient(ellipse at center, rgba(10,20,40,0.95), #020510)' }}>
          <div className="w-full max-w-sm rounded-2xl p-8 shadow-2xl flex flex-col items-center"
               style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="flex justify-center items-center mb-3">
                <img src={shield} className="h-30 w-30 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">App Locked</h2>
            <p className="text-sm text-gray-400 mb-8 text-center">Enter your password to continue</p>
            <form onSubmit={handleNormalUnlock} className="w-full flex flex-col gap-4">
              {normalLockError && (
                <div className="text-red-400 text-sm text-center font-medium bg-red-400/10 p-2.5 rounded-xl border border-red-400/20">{normalLockError}</div>
              )}
              <input type="password" value={normalLockInput} onChange={e => setNormalLockInput(e.target.value)}
                placeholder="Password" autoFocus required
                className="w-full bg-black/40 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-center text-lg tracking-widest" />
              <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all mt-2">Unlock</button>
            </form>
            <p className="text-xs text-blue-400 mt-4 font-medium tracking-wide">ATTEMPTS REMAINING: {3 - normalLockAttempts}</p>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

function App() {
  return (
    <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </Router>
  );
}

const AppContent = () => {
  const { isPrivateMode, setIsPrivateMode, setPrivateMessages, masked, setMasked, lockPassword, setLockPassword, lockAttempts, setLockAttempts, authToken } = useContext(ChatContext);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [lockError, setLockError] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();
    if (unlockPassword === lockPassword) {
      setMasked(false);
      setLockPassword('');
      setLockAttempts(0);
      setUnlockPassword('');
      setLockError('');
    } else {
      const newAttempts = lockAttempts + 1;
      setUnlockPassword(''); 
      if (newAttempts >= 3) {
        deletePrivateDocumentsApi(authToken).catch(e => console.error(e));
        alert("Maximum attempts reached, Exiting Private Mode and clearing the data");
        setMasked(false);
        setLockPassword('');
        setLockAttempts(0);
        setUnlockPassword('');
        setLockError('');
        setIsPrivateMode(false);
        setPrivateMessages([]);
      } else {
        setLockAttempts(newAttempts);
        setLockError("Incorrect password");
        setTimeout(() => {
          setLockError('');
        }, 1500);
      }
    }
  };

  return (
    <div className={`app-shell ${isPrivateMode ? 'bg-[#080510]' : ''} relative`}>
      <NavBar />
      <main className="app-main overflow-hidden">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomeRoute />} />
            <Route path="/chat" element={<ProtectedRoute>{isPrivateMode ? <PrivateChatPage /> : <ChatPage />}</ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/share/:sessionId" element={<SharedChatPage />} />
          </Routes>
      </main>

      {/* Lock Screen Overlay */}
      {isPrivateMode && masked && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center p-4 backdrop-blur-xl"
             style={{ background: 'radial-gradient(ellipse at center, rgba(15,10,25,0.9), #05020a)' }}>
          <div className="glass w-full max-w-sm rounded-2xl p-8 shadow-2xl flex flex-col items-center"
               style={{ background: 'rgba(15,10,25,0.6)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <div className="flex justify-center items-center mb-3">
                <img src={shield} className="h-30 w-30 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Session Locked</h2>
            <p className="text-sm text-gray-400 mb-8 text-center">Enter your temporary password to unlock.</p>
            
            <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
              {lockError && (
                <div className="text-red-400 text-sm text-center font-medium bg-red-400/10 p-2.5 rounded-xl border border-red-400/20 animate-fade-in shadow-[0_0_10px_rgba(248,113,113,0.1)]">
                  {lockError}
                </div>
              )}
              <input type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-center text-lg tracking-widest"
                autoFocus required/>
              <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all mt-2">
                Unlock
              </button>
            </form>
            <p className="text-xs text-purple-400 mt-4 font-medium tracking-wide">
              ATTEMPTS REMAINING: {3 - lockAttempts}
            </p>
            
            <div className="mt-6 pt-4 border-t border-purple-500/20 w-full text-center">
              <button onClick={async () => {
                  if (window.confirm("Are you sure you want to exit? This will delete your private chat")) {
                    try {
                      await deletePrivateDocumentsApi(authToken);
                    } catch (e) {
                      console.error('Failed to wipe private documents:', e);
                    }
                    setMasked(false);
                    setLockPassword('');
                    setLockAttempts(0);
                    setUnlockPassword('');
                    setLockError('');
                    setIsPrivateMode(false);
                    setPrivateMessages([]);
                  }
                }}
                className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">
                Exit & Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
