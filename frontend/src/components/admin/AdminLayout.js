import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ADMIN_MENU } from './adminMenu';
import './AdminLayout.css';
import '../AdminDashboard.css';

const API_URL = (typeof window !== 'undefined' ? window.location.origin : '');

const AdminLayout = ({ user }) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="admin-layout">
      <header className="admin-layout-header">
        <div className="admin-layout-header-inner">
          <div className="admin-layout-brand">
            <button
              type="button"
              className="admin-layout-menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label="Buka menu admin"
            >
              ☰
            </button>
            <h1 className="admin-layout-title">Studio Hanif</h1>
          </div>
          <div className="admin-layout-user">
            <img
              src={`${process.env.PUBLIC_URL}/images/novel/Hanif.jpeg`}
              alt="Hanifudin"
              className="admin-layout-avatar"
            />
            <div>
              <p className="admin-layout-user-name">Hanifudin</p>
              <p className="admin-layout-user-email">{user?.email}</p>
            </div>
            <button onClick={handleLogout} disabled={isLoggingOut} className="admin-layout-logout">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      <div className={`admin-layout-shell ${menuOpen ? 'menu-open' : ''}`}>
        <aside className="admin-sidebar">
          <nav className="admin-sidebar-nav" onClick={() => setMenuOpen(false)}>
            <NavLink to="/admin" end className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="admin-sidebar-icon">🏠</span>
              <span className="admin-sidebar-text">
                <strong>Ringkasan</strong>
                <small>Ikhtisar ruang kerja</small>
              </span>
            </NavLink>
            {ADMIN_MENU.map((item) => (
              <NavLink
                key={item.slug}
                to={`/admin/${item.slug}`}
                className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="admin-sidebar-icon">{item.icon}</span>
                <span className="admin-sidebar-text">
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </NavLink>
            ))}
          </nav>
          <button onClick={() => navigate('/portfolio')} className="admin-layout-back">
            Lihat portfolio →
          </button>
        </aside>

        <main className="admin-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
