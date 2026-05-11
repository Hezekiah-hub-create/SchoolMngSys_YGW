import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { settingsAPI } from '../../services/api';
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
  const [loading, setLoading] = useState(true);
  const [loginSessions, setLoginSessions] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.getLoginHistory();
      if (res.data?.success) {
        setLoginSessions(res.data.data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); }
  };

  const currentUser = storedUser || user;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #00843e', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>Loading activity logs...</p>
                      </td>
                    </tr>
                  ) : loginSessions.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '60px', textAlign: 'center' }}>
                        <p style={{ color: '#94a3b8', fontSize: '16px' }}>No recent login activity found.</p>
                      </td>
                    </tr>
                  ) : loginSessions.map((session, index) => (
                    <tr key={session.id || index} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ color: '#64748b' }}>
                            {(session.device || '').includes('Mobile') || (session.device || '').includes('iOS') || (session.device || '').includes('Android') ? <Icons.Smartphone /> : <Icons.Monitor />}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{session.device || 'Unknown Device'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#64748b' }}>{session.ip_address || 'Unknown'}</td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#64748b' }}>{session.location || 'Ghana'}</td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#64748b' }}>{formatDate(session.login_time)}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '800',
                          backgroundColor: index === 0 ? '#ecfdf5' : '#f1f5f9',
                          color: index === 0 ? '#10b981' : '#64748b'
                        }}>
                          {index === 0 ? 'Current Session' : 'Success'}
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
