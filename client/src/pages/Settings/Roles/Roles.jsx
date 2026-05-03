import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';

import TopNav from '../../../components/layout/TopNav';


const SettingsRoles = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Settings');

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const roles = [
    { id: 1, name: 'Administrator', description: 'Full system access', users: 3, permissions: ['All'] },
    { id: 2, name: 'Teacher', description: 'Manage classes and grades', users: 25, permissions: ['Students', 'Attendance', 'Grades', 'Assignments'] },
    { id: 3, name: 'Student', description: 'View courses and submit assignments', users: 350, permissions: ['Courses', 'Assignments', 'Grades'] },
    { id: 4, name: 'Parent', description: 'Monitor child progress', users: 280, permissions: ['Child Info', 'Grades', 'Attendance', 'Fees'] },
    { id: 5, name: 'Finance Officer', description: 'Manage payments and fees', users: 2, permissions: ['Fees', 'Payments', 'Reports'] },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={user} onLogout={handleLogout} />
        <main style={{ padding: '100px 40px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Security Protocols</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Authorization Matrix</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Security <span style={{ color: 'var(--brand-green)' }}>Roles</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Manage authorization tiers and functional access permissions across the institution.</p>
            </div>
            <button className="premium-btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Establish Role
            </button>
          </div>


          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {roles.map((role) => (
              <div key={role.id || role._id} className="glass-card premium-row" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--brand-slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-green)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <span style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #d1fae5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{role.users} Members</span>
                </div>
                
                <div style={{ marginBottom: '24px', flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{role.name}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', lineHeight: '1.6', fontWeight: '500' }}>{role.description}</p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Clearance Nodes:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {role.permissions.map((perm, idx) => (
                      <span key={idx} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', backgroundColor: 'var(--brand-slate-50)', color: '#475569', fontWeight: '700', border: '1px solid var(--brand-slate-100)' }}>{perm}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="premium-btn-secondary" style={{ flex: 1, padding: '12px' }}>Configure</button>
                  <button className="premium-btn-secondary" style={{ flex: 1, padding: '12px', backgroundColor: '#fefce8', color: '#854d0e', borderColor: '#fef08a' }}>Authority Matrix</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsRoles;
