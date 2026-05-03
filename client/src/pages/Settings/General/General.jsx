import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsAPI, authAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import TopNav from '../../../components/layout/TopNav';

const General = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Settings');
  
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const currentUser = storedUser || user;

  async function fetchData() {
    try {
      setLoading(true);
      const response = await settingsAPI.get();
      if (response?.data) {
        setSettings(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
    fetchData();
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.update(settings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', sans-serif" }}>
      <RoleBasedSidebar user={currentUser} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={currentUser} onLogout={handleLogout} />
        
        <main style={{ padding: '100px 40px 40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>System Control</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>General Settings</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Global <span style={{ color: 'var(--brand-green)' }}>Preferences</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Manage system configurations and institutional details.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="premium-btn-primary"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              {saving ? 'Saving...' : 'Sync Changes'}
            </button>
          </div>


          {success && (
            <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #10b981', fontWeight: '500' }}>{success}</div>
          )}

          {/* Settings Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* School Information */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏫</div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Institutional Profile</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="premium-label">School Name</label>
                  <input
                    type="text"
                    className="premium-input"
                    value={settings.schoolName || ''}
                    onChange={(e) => setSettings({...settings, schoolName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="premium-label">Official Email</label>
                  <input
                    type="email"
                    className="premium-input"
                    value={settings.email || ''}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="premium-label">Contact Hotline</label>
                  <input
                    type="tel"
                    className="premium-input"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>


            {/* Academic Settings */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fffbeb', color: 'var(--brand-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📚</div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Academic Calendar</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="premium-label">Current Session</label>
                  <input
                    type="text"
                    className="premium-input"
                    value={settings.academicYear || ''}
                    onChange={(e) => setSettings({...settings, academicYear: e.target.value})}
                  />
                </div>
                <div>
                  <label className="premium-label">Active Term</label>
                  <select
                    className="premium-input"
                    value={settings.term || ''}
                    onChange={(e) => setSettings({...settings, term: e.target.value})}
                  >
                    <option value="">Select Term</option>
                    <option value="1">First Term</option>
                    <option value="2">Second Term</option>
                    <option value="3">Third Term</option>
                  </select>
                </div>
                <div>
                  <label className="premium-label">Standard Arrival Time</label>
                  <input
                    type="time"
                    className="premium-input"
                    value={settings.startTime || ''}
                    onChange={(e) => setSettings({...settings, startTime: e.target.value})}
                  />
                </div>
              </div>
            </div>


            {/* Fee Settings */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💰</div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Fiscal Parameters</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="premium-label">Operational Currency</label>
                  <select
                    className="premium-input"
                    value={settings.currency || 'GHS'}
                    onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  >
                    <option value="GHS">GHS - Ghana Cedis</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="premium-label">Fee Settlement Threshold (Day)</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={settings.feeDueDay || ''}
                    onChange={(e) => setSettings({...settings, feeDueDay: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔔</div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Institutional Alerts</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '12px 16px', backgroundColor: 'var(--brand-slate-50)', borderRadius: '12px', border: '1px solid var(--brand-slate-100)' }}>
                  <input type="checkbox" checked={settings.emailNotifications !== false} onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green)' }} />
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>Email Notification Matrix</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '12px 16px', backgroundColor: 'var(--brand-slate-50)', borderRadius: '12px', border: '1px solid var(--brand-slate-100)' }}>
                  <input type="checkbox" checked={settings.smsNotifications !== false} onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green)' }} />
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>SMS Broadcast Protocols</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '12px 16px', backgroundColor: 'var(--brand-slate-50)', borderRadius: '12px', border: '1px solid var(--brand-slate-100)' }}>
                  <input type="checkbox" checked={settings.pushNotifications !== false} onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green)' }} />
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>Real-time Push Synchrony</span>
                </label>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default General;