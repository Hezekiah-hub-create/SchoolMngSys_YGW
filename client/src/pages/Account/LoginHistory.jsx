import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';

// Premium Icon Components
const Icons = {
  History: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Monitor: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Smartphone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const LoginHistory = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [storedUser, setStoredUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Login History');

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); }
  };

  const currentUser = storedUser || user;

  const loginSessions = [
    { id: 1, device: 'Desktop Chrome', ip: '192.168.1.45', location: 'Accra, Ghana', time: 'Today, 08:30 AM', status: 'Current Session' },
    { id: 2, device: 'iPhone 13 Safari', ip: '192.168.1.45', location: 'Accra, Ghana', time: 'Yesterday, 06:15 PM', status: 'Success' },
    { id: 3, device: 'Desktop Chrome', ip: '192.168.1.12', location: 'Kumasi, Ghana', time: '23 Oct 2023, 10:20 AM', status: 'Success' },
    { id: 4, device: 'Desktop Firefox', ip: '102.176.1.89', location: 'Accra, Ghana', time: '20 Oct 2023, 02:45 PM', status: 'Success' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', sans-serif" }}>
      <RoleBasedSidebar user={currentUser} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={currentUser} onLogout={handleLogout} />
        
        <main style={{ padding: '100px 40px 40px' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Login History</h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Monitor your account activity and recognized devices</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            {/* Summary Banner */}
            <div style={{ 
              backgroundColor: '#00843e', 
              borderRadius: '24px', 
              padding: '32px', 
              color: 'white', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 20px 40px rgba(0, 132, 62, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '14px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '16px' }}><Icons.Shield /></div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Your account is secure</h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Last security check was performed today at 09:00 AM.</p>
                </div>
              </div>
              <button style={{ padding: '12px 24px', backgroundColor: 'white', color: '#00843e', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                Security Settings
              </button>
            </div>

            {/* Sessions Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#00843e' }}><Icons.History /></div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Recent Activity</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Device / OS</th>
                    <th style={{ textAlign: 'left', padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>IP Address</th>
                    <th style={{ textAlign: 'left', padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Location</th>
                    <th style={{ textAlign: 'left', padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</th>
                    <th style={{ textAlign: 'left', padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loginSessions.map((session) => (
                    <tr key={session.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ color: '#64748b' }}>
                            {session.device.includes('iPhone') ? <Icons.Smartphone /> : <Icons.Monitor />}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{session.device}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#64748b' }}>{session.ip}</td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#64748b' }}>{session.location}</td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#64748b' }}>{session.time}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '800',
                          backgroundColor: session.status === 'Current Session' ? '#ecfdf5' : '#f1f5f9',
                          color: session.status === 'Current Session' ? '#10b981' : '#64748b'
                        }}>
                          {session.status}
                        </span>
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

export default LoginHistory;
