import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';

import TopNav from '../../../components/layout/TopNav';


const SettingsUsers = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Settings');

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const users = [
    { id: 1, name: 'John Doe', email: 'john@goshenschools.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-15 10:30 AM' },
    { id: 2, name: 'Jane Smith', email: 'jane@goshenschools.com', role: 'Teacher', status: 'Active', lastLogin: '2024-01-15 09:15 AM' },
    { id: 3, name: 'Michael Brown', email: 'michael@goshenschools.com', role: 'Teacher', status: 'Active', lastLogin: '2024-01-14 02:45 PM' },
    { id: 4, name: 'Emily Wilson', email: 'emily@goshenschools.com', role: 'Finance', status: 'Active', lastLogin: '2024-01-15 08:00 AM' },
    { id: 5, name: 'David Lee', email: 'david@goshenschools.com', role: 'Parent', status: 'Inactive', lastLogin: '2024-01-10 04:20 PM' },
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
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>System Architecture</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Access Control</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>User <span style={{ color: 'var(--brand-green)' }}>Management</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Administer institutional identities and security clearance protocols.</p>
            </div>
            <button className="premium-btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
              Provision Identity
            </button>
          </div>


          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--brand-slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Identity Registry Nexus</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--brand-slate-50)', borderRadius: '12px', padding: '8px 16px', border: '1px solid var(--brand-slate-100)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="text" placeholder="Filter identities..." style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '13px', marginLeft: '8px', fontWeight: '600', color: '#0f172a', width: '180px' }} />
                </div>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--brand-slate-50)' }}>
                    <th className="premium-th">Identity Node</th>
                    <th className="premium-th">Electronic Mail</th>
                    <th className="premium-th">Security Role</th>
                    <th className="premium-th">Auth Status</th>
                    <th className="premium-th">Temporal Node</th>
                    <th className="premium-th" style={{ textAlign: 'right' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id || u._id} className="premium-row" style={{ borderBottom: '1px solid var(--brand-slate-100)' }}>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--brand-slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'var(--brand-slate-600)', fontSize: '14px' }}>{u.name[0]}</div>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: '14px', color: '#475569', fontWeight: '600' }}>{u.email}</td>
                      <td style={{ padding: '20px 32px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '900', 
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          backgroundColor: u.role === 'Admin' ? '#fefce8' : '#ecfdf5', 
                          color: u.role === 'Admin' ? '#854d0e' : '#065f46',
                          border: `1px solid ${u.role === 'Admin' ? '#fef08a' : '#d1fae5'}`
                        }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.status === 'Active' ? 'var(--brand-green)' : '#ef4444' }}></div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: u.status === 'Active' ? 'var(--brand-green)' : '#ef4444' }}>{u.status}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{u.lastLogin}</td>
                      <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="premium-btn-secondary" style={{ padding: '8px 12px', fontSize: '12px' }}>Configure</button>
                          <button style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Revoke</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>

  );
};

export default SettingsUsers;

