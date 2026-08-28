import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAlert } from '../../../context/AlertContext';
import SettingsTabs from '../../../components/layout/SettingsTabs';
import api from '../../../services/api';
import '../Settings.css';

const roleColors = {
  admin: { bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
  teacher: { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
  staff: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  parent: { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
  finance: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
  itsupport: { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
  admission: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
};

const SettingsUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [identities, setIdentities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchIdentities = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/users');
        const data = response.data?.data || response.data?.users || [];
        setIdentities(data);
      } catch (err) {
        console.error('Error fetching identities:', err);
        setError('Could not load identity registry. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchIdentities();
  }, []);

  const filteredIdentities = identities.filter(u => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const role = (u.role || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return name.includes(q) || email.includes(q) || role.includes(q);
  });

  const getRoleStyle = (role) => roleColors[role?.toLowerCase()] || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return 'Unknown'; }
  };

  return (
    <>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '1000', color: 'var(--slate-900)', letterSpacing: '-2px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
          Identity <span style={{ color: 'var(--brand-green)' }}>Management</span>
        </h1>
        <p style={{ color: 'var(--slate-500)', fontWeight: '600', marginTop: '4px' }}>Listing of all active users within the system.</p>
      </header>

      <SettingsTabs />

      <div className="settings-card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="settings-card-title">Identity Registry</h3>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>
              {loading ? 'Loading...' : `${filteredIdentities.length} of ${identities.length} users`}
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Search users..."
              className="settings-input"
              style={{ padding: '10px 16px 10px 44px', width: '240px', fontSize: '13px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', minHeight: '300px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <div style={{ color: 'var(--brand-green)', fontWeight: '800', fontSize: '16px' }}>Loading identity registry...</div>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ color: '#ef4444', fontWeight: '700', fontSize: '15px', margin: 0 }}>{error}</p>
              <button className="premium-btn-secondary" onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : filteredIdentities.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p style={{ color: '#94a3b8', fontWeight: '600', fontSize: '15px', margin: 0 }}>No users found</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                    <th key={h} style={{ padding: '14px 28px', textAlign: i === 4 ? 'right' : 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredIdentities.map((u) => {
                  const rc = getRoleStyle(u.role);
                  const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || u.email?.[0]?.toUpperCase() || '?';
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '18px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#64748b', fontSize: '14px', border: '1px solid #e2e8f0', flexShrink: 0 }}>{initials}</div>
                          <div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{u.first_name} {u.last_name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 28px' }}>
                        <span style={{ padding: '5px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '18px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.is_active !== false ? '#22c55e' : '#ef4444' }}></div>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: u.is_active !== false ? '#16a34a' : '#ef4444' }}>{u.is_active !== false ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '18px 28px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{formatDate(u.created_at)}</span>
                      </td>
                      <td style={{ padding: '18px 28px', textAlign: 'right' }}>
                        <button className="premium-btn-secondary" onClick={() => showAlert({ type: 'info', title: 'User Configuration', message: 'User configuration panel coming soon.' })} style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '10px' }}>Configure</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default SettingsUsers;

