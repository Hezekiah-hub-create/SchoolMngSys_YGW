import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { settingsAPI } from '../../../services/api';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';

import TopNav from '../../../components/layout/TopNav';


const SettingsAcademic = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    currentSession: '',
    currentTerm: '',
    gradingSystem: []
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      if (response.data.success) {
        setSettings({
          currentSession: response.data.settings.currentSession || '',
          currentTerm: response.data.settings.currentTerm || '',
          gradingSystem: response.data.settings.gradingSystem || []
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Failed to load academic settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleGradeChange = (index, field, value) => {
    const updatedGrades = [...settings.gradingSystem];
    updatedGrades[index] = { ...updatedGrades[index], [field]: value };
    setSettings(prev => ({ ...prev, gradingSystem: updatedGrades }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await settingsAPI.updateSettings(settings);
      if (response.data.success) {
        alert('Academic settings updated successfully!');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading academic settings...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={user} onLogout={handleLogout} />
        <main style={{ padding: '100px 40px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Config</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Academic Architecture</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Academic <span style={{ color: 'var(--brand-green)' }}>Settings</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Configure foundational academic parameters and evaluation matrices.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="premium-btn-primary"
              style={{ padding: '16px 32px' }}
            >
              {saving ? <div className="premium-loader" style={{ width: '20px', height: '20px' }}></div> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>}
              {saving ? 'Synchronizing...' : 'Deploy Settings'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '28px', letterSpacing: '-0.5px' }}>Temporal Configuration</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <label className="premium-label">Current Academic Session</label>
                <select 
                  name="currentSession"
                  value={settings.currentSession}
                  onChange={handleInputChange}
                  className="premium-input"
                >
                  <option value="2023/2024">2023/2024 Academic Year</option>
                  <option value="2024/2025">2024/2025 Academic Year</option>
                </select>
              </div>
              <div>
                <label className="premium-label">Operational Term</label>
                <select 
                  name="currentTerm"
                  value={settings.currentTerm}
                  onChange={handleInputChange}
                  className="premium-input"
                >
                  <option value="1st">First Academic Term</option>
                  <option value="2nd">Second Academic Term</option>
                  <option value="3rd">Third Academic Term</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--brand-slate-100)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Evaluation Matrix (Grading System)</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>Define the threshold and weightage for academic classifications.</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--brand-slate-50)' }}>
                    <th className="premium-th">Classification</th>
                    <th className="premium-th">Minimum Node</th>
                    <th className="premium-th">Maximum Node</th>
                    <th className="premium-th">Weightage Point</th>
                    <th className="premium-th">Institutional Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.gradingSystem.map((grad, index) => (
                    <tr key={index} className="premium-row" style={{ borderBottom: '1px solid var(--brand-slate-100)' }}>
                      <td style={{ padding: '16px 32px' }}>
                        <input 
                          type="text" 
                          value={grad.grade} 
                          onChange={(e) => handleGradeChange(index, 'grade', e.target.value)}
                          className="premium-input"
                          style={{ width: '80px', textAlign: 'center', fontWeight: '900', fontSize: '16px', color: 'var(--brand-green)' }} 
                        />
                      </td>
                      <td style={{ padding: '16px 32px' }}>
                        <input 
                          type="number" 
                          value={grad.minScore} 
                          onChange={(e) => handleGradeChange(index, 'minScore', parseInt(e.target.value))}
                          className="premium-input"
                          style={{ width: '100px', textAlign: 'center', fontWeight: '700' }} 
                        />
                      </td>
                      <td style={{ padding: '16px 32px' }}>
                        <input 
                          type="number" 
                          value={grad.maxScore} 
                          onChange={(e) => handleGradeChange(index, 'maxScore', parseInt(e.target.value))}
                          className="premium-input"
                          style={{ width: '100px', textAlign: 'center', fontWeight: '700' }} 
                        />
                      </td>
                      <td style={{ padding: '16px 32px' }}>
                        <input 
                          type="number" 
                          step="0.1"
                          value={grad.gradePoint} 
                          onChange={(e) => handleGradeChange(index, 'gradePoint', parseFloat(e.target.value))}
                          className="premium-input"
                          style={{ width: '90px', textAlign: 'center', fontWeight: '700', color: 'var(--brand-green)' }} 
                        />
                      </td>
                      <td style={{ padding: '16px 32px' }}>
                        <input 
                          type="text" 
                          value={grad.remark} 
                          onChange={(e) => handleGradeChange(index, 'remark', e.target.value)}
                          className="premium-input"
                          style={{ width: '100%', fontWeight: '600' }} 
                        />
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

export default SettingsAcademic;

