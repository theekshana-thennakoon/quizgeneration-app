import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrainCircuit, Moon, Sun, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isDark) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <nav className="navbar glass-panel">
      <Link to="/" className="nav-brand gradient-text">
        <BrainCircuit size={28} className="text-primary" />
        QuizGenius AI
      </Link>
      
      <div className="nav-links">
        <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
        <Link to="/upload" className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}>New Quiz</Link>
        
        <button onClick={toggleTheme} className="btn btn-icon btn-secondary" aria-label="Toggle Theme">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {user ? (
          <>
            <span style={{ fontWeight: '500', color: 'var(--primary)', marginRight: '0.5rem' }}>{user.name.split(' ')[0]}</span>
            <button onClick={logout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              <LogOut size={18} />
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <User size={18} />
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
