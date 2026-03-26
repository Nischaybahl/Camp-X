import { Compass, Moon, Sun, Menu, X } from 'lucide-react';
import Spline from '@splinetool/react-spline';
import type { Application } from '@splinetool/runtime';
import { useRef, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Intro from './pages/Intro';
import CampusComplaint from './pages/CampusComplaint';
import Notes from './pages/Notes';
import Attendance from './pages/Attendance';
import PYQ from './pages/PYQ';
import AcademiaCentral from './pages/AcademiaCentral';
import CollegeUpdates from './pages/CollegeUpdates';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('campx_current_user');
  if (!user) {
    // Redirect to login if user object is not found in localStorage
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

interface NavigationProps {
  isLightMode: boolean;
  toggleTheme: () => void;
}

function Navigation({ isLightMode, toggleTheme }: NavigationProps) {
  const location = useLocation();
  const path = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('campx_current_user') || 'null');
  const isLoggedIn = !!user;
  const isAdmin = !!(user && user.isAdmin);

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('campx_current_user');
    window.location.href = '/';
  };

  return (
    <nav className="navbar fade-in-up" style={{ zIndex: 10 }}>
      <Link to="/home" className="logo-container" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="logo-icon">
          <Compass size={28} color="var(--accent)" strokeWidth={2} />
        </div>
        <span>CampX<span style={{ color: 'var(--accent)' }}>.</span></span>
      </Link>

      <div className={`nav-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
        <Link to="/home" className="nav-link" onClick={closeMenu} style={{ color: path === '/home' ? 'var(--primary)' : 'var(--secondary)' }}>Home</Link>
        <Link to="/campus-complaint" className="nav-link" onClick={closeMenu} style={{ color: path === '/campus-complaint' ? 'var(--primary)' : 'var(--secondary)' }}>Campus Complaint</Link>

        <Link to="/notes" className="nav-link" onClick={closeMenu} style={{ color: path === '/notes' ? 'var(--primary)' : 'var(--secondary)' }}>Notes</Link>
        <Link to="/attendance" className="nav-link" onClick={closeMenu} style={{ color: path === '/attendance' ? 'var(--primary)' : 'var(--secondary)' }}>Attendance</Link>
        <Link to="/pyq" className="nav-link" onClick={closeMenu} style={{ color: path === '/pyq' ? 'var(--primary)' : 'var(--secondary)' }}>PYQ</Link>
        <Link to="/academia-central" className="nav-link" onClick={closeMenu} style={{ color: path === '/academia-central' ? 'var(--primary)' : 'var(--secondary)' }}>Academia Central</Link>
        <Link to="/college-updates" className="nav-link" onClick={closeMenu} style={{ color: path === '/college-updates' ? 'var(--primary)' : 'var(--secondary)' }}>College Updates</Link>
        {isAdmin && (
          <>
            <Link to="/admin" className="nav-link" onClick={closeMenu} style={{ color: path === '/admin' ? '#ccff00' : 'var(--secondary)', fontWeight: 'bold' }}>Admin Panel</Link>
          </>
        )}
      </div>

      <div className="nav-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: '1px solid var(--glass-border)',
            color: 'var(--primary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        {isLoggedIn ? (
          <button className="btn-white" onClick={handleLogout} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '2rem' }}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button className="btn-white" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '2rem' }}>
                Sign In
              </button>
            </Link>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">
                Sign Up
              </button>
            </Link>
          </>
        )}

        {/* Mobile menu toggle button */}
        <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
                display: 'flex', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--primary)', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', marginLeft: '0.5rem'
            }}
        >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  );
}

function MainApp() {
  const [isLightMode, setIsLightMode] = useState(false);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
    if (!isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };
  const splineRef = useRef<Application | null>(null);
  const location = useLocation();
  const isHome = location.pathname === '/home';
  const isIntro = location.pathname === '/';

  const handleLoad = (splineApp: Application) => {
    splineRef.current = splineApp;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!splineRef.current) return;

      const head = splineRef.current.findObjectByName('Head');
      if (head) {
        // Calculate relative position (-0.5 to +0.5)
        const xPos = (e.clientX / window.innerWidth) - 0.5;
        const yPos = (e.clientY / window.innerHeight) - 0.5;

        // Update head rotation relative to the mouse
        head.rotation.y = xPos * Math.PI * 0.8;
        head.rotation.x = yPos * Math.PI * 0.5;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isLoggedIn = !!localStorage.getItem('campx_current_user');

  return (
    <div
      className="hero-section"
      style={{
        backgroundImage: (isHome && !isLightMode)
          ? "url('https://static.scientificamerican.com/sciam/assets/Image/2019/spinningblackhole.gif')"
          : "none",
        backgroundColor: isIntro ? "#000" : "var(--bg-dark)",
        backgroundAttachment: "fixed"
      }}
    >
      {isHome && <div className="hero-overlay"></div>}

      {isHome && (
        <div className="spline-container-wrapper" id="spline-container">
          <Spline
            scene="https://prod.spline.design/Asn37HPiSzSQRnBg/scene.splinecode"
            onLoad={handleLoad}
          />
        </div>
      )}

      <div className="content-wrapper">
        {(!isIntro || isLoggedIn) && <Navigation isLightMode={isLightMode} toggleTheme={toggleTheme} />}

        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/campus-complaint" element={<ProtectedRoute><CampusComplaint /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/pyq" element={<ProtectedRoute><PYQ /></ProtectedRoute>} />
          <Route path="/academia-central" element={<ProtectedRoute><AcademiaCentral /></ProtectedRoute>} />
          <Route path="/college-updates" element={<ProtectedRoute><CollegeUpdates /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}
