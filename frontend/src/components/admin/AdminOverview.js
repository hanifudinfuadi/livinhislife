import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_MENU } from './adminMenu';

const AdminOverview = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="admin-welcome">
        <span className="admin-eyebrow">RUANG KERJA PRIBADI</span>
        <h2>Selamat datang, Hanifudin.</h2>
        <p>Kelola cerita, foto, dan fragments yang tampil di portfolio Anda.</p>
      </div>

      <div className="admin-cards">
        {ADMIN_MENU.map((item) => (
          <div key={item.slug} className={`admin-card ${item.featured ? 'ai-card-active' : ''}`}>
            <div className="admin-card-icon">{item.icon}</div>
            <h3>{item.label}</h3>
            <p>{item.hint}</p>
            <button
              className={`admin-card-btn ${item.featured ? 'admin-card-btn-active' : ''}`}
              onClick={() => navigate(`/admin/${item.slug}`)}
            >
              {item.cta}
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminOverview;
