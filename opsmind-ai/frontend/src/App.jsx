import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ChatProvider, ChatContext } from './context/ChatContext';
import { useContext, useState, useEffect } from 'react';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import { Menu, X, MessageSquare, Upload, LogOut, User } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { userEmail } = useContext(ChatContext);
  const location = useLocation();
  // Only require email — API key is optional (server has a default)
  if (!userEmail) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const HomeRoute = () => {
  const { userEmail } = useContext(ChatContext);
  return userEmail ? <ChatPage /> : <LandingPage />;
};

const NavBar = () => {
  const { userEmail, logout } = useContext(ChatContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Close mobile menu on click outside or scroll
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleOutsideInteraction = (e) => {
      if (!e.target.closest('.nav-bar')) {
        setMobileMenuOpen(false);
      }
    };

    const handleScroll = (e) => {
      // Don't close if the scroll was inside the navbar itself
      if (!e.target.closest?.('.nav-bar')) {
        setMobileMenuOpen(false);
      }
    };

    // Use setTimeout to avoid immediately closing from the toggle click
    setTimeout(() => {
      document.addEventListener('pointerdown', handleOutsideInteraction, true); // capture phase
      document.addEventListener('scroll', handleScroll, true); // capture phase (scroll doesn't bubble)
    }, 0);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideInteraction, true);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [mobileMenuOpen]);

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
              <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-1">
                <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'nav-link-active' : ''}`} title="View Profile">
                  <User size={16} />
                  <span className="max-w-100px truncate">{userEmail.split('@')[0]}</span>
                </Link>
                <button onClick={logout} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" state={{ isLogin: true }} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Log In
              </Link>
              <Link to="/login" state={{ isLogin: false }} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu animate-fade-in">
          {userEmail ? (
            <>
              <Link to="/chat" className={`nav-mobile-link ${isActive('/chat') || isActive('/') ? 'nav-link-active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <MessageSquare size={16} /> Chat
              </Link>
              <Link to="/admin" className={`nav-mobile-link ${isActive('/admin') ? 'nav-link-active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <Upload size={16} /> Uploads
              </Link>
              <div className="h-px bg-white/5 my-1"></div>
              <Link to="/profile" className={`nav-mobile-link ${isActive('/profile') ? 'nav-link-active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <User size={16} /> My Profile ({userEmail.split('@')[0]})
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
        <div className="app-shell">
          <NavBar />
          <main className="app-main">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<HomeRoute />} />
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              </Routes>
          </main>
        </div>
      </ChatProvider>
    </Router>
  );
}

export default App;
