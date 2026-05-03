import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicSubjectsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';
import PremiumSelect from '../../components/common/PremiumSelect';

const Subjects = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Academic');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', category: 'Core', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await academicSubjectsAPI.getAll();
      setSubjects(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSubject) {
        await academicSubjectsAPI.update(editingSubject.id, formData);
      } else {
        await academicSubjectsAPI.create(formData);
      }
      setShowModal(false);
      setEditingSubject(null);
      setFormData({ name: '', code: '', category: 'Core', description: '' });
      fetchData();
    } catch (error) {
      alert('Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sub) => {
    setEditingSubject(sub);
    setFormData({ name: sub.name, code: sub.code || '', category: sub.category || 'Core', description: sub.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await academicSubjectsAPI.delete(id);
        fetchData();
      } catch (error) {
        alert('Failed to delete subject.');
      }
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally { 
      localStorage.removeItem('authToken'); 
      localStorage.removeItem('authUser'); 
      navigate('/login'); 
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Outfit', sans-serif" }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={user} onLogout={handleLogout} />
        
        <main style={{ padding: '100px 40px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Curriculum Registry</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Subject Repository</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Subject <span style={{ color: 'var(--brand-green)' }}>Catalog</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Manage the master list of academic subjects and course definitions.</p>
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => { setEditingSubject(null); setFormData({name:'', code:'', category: 'Core', description:''}); setShowModal(true); }} className="premium-btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Define New Subject
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div className="glass-card mini-stats">
              <div className="mini-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div>
                <p className="mini-label">Core Subjects</p>
                <p className="mini-value">{subjects.filter(s => s.category === 'Core').length}</p>
              </div>
            </div>
            <div className="glass-card mini-stats">
              <div className="mini-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div>
                <p className="mini-label">Elective Nodes</p>
                <p className="mini-value">{subjects.filter(s => s.category === 'Elective').length}</p>
              </div>
            </div>
            <div className="glass-card mini-stats">
              <div className="mini-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p className="mini-label">Departmental Nodes</p>
                <p className="mini-value">Core Arts & Sci</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px' }}><div className="premium-loader"></div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
              {subjects.map((sub) => (
                <div key={sub.id} className="glass-card subject-node">
                  <div className="node-top">
                    <div className="icon-wrap">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 className="sub-title">{sub.name}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="sub-code">{sub.code || 'MNEMONIC-X'}</span>
                        <span className={`category-tag ${sub.category?.toLowerCase() || 'core'}`}>{sub.category || 'Core'}</span>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="node-actions">
                        <button onClick={() => handleEdit(sub)} className="node-btn edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button onClick={() => handleDelete(sub.id)} className="node-btn delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                      </div>
                    )}
                  </div>
                  <div className="node-description">
                    <p>{sub.description || 'Institutional curriculum parameters for this subject are defined within the class hierarchy. No additional metadata provided.'}</p>
                  </div>
                  <div className="node-footer">
                    <div className="curriculum-tag">Standard Curriculum</div>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <div className="empty-catalog">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  <p>Subject repository is currently empty.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 className="modal-title">{editingSubject ? 'Edit Subject Node' : 'Define Subject Node'}</h3>
                <p className="modal-subtitle">Curriculum parameters for the institutional catalog.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="premium-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label className="premium-label">Subject Nomenclature</label>
                <input className="premium-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Core Mathematics" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label className="premium-label">Catalog Code</label>
                  <input className="premium-input" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. CORE-MATH" />
                </div>
                <div>
                  <label className="premium-label">Subject Category</label>
                  <PremiumSelect 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    options={[
                      { value: 'Core', label: 'Core Subject' },
                      { value: 'Elective', label: 'Elective Subject' }
                    ]}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label className="premium-label">Curriculum Description</label>
                <textarea className="premium-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Overview of the subject scope..." rows="3" style={{ resize: 'none' }} />
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Syncing...' : (editingSubject ? 'Update Catalog' : 'Enroll Subject')}</button>
                <button type="button" onClick={() => setShowModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Dismiss</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }

        .mini-stats { padding: 20px; display: flex; align-items: center; gap: 16px; }
        .mini-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .mini-label { margin: 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        .mini-value { margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; }

        .subject-node { padding: 30px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .subject-node:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.9); box-shadow: 0 20px 50px rgba(0, 132, 62, 0.05); }

        .node-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
        .icon-wrap { width: 50px; height: 50px; border-radius: 14px; background: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; }
        
        .sub-title { margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
        .sub-code { font-size: 11px; font-weight: 800; color: var(--brand-green); text-transform: uppercase; letter-spacing: 1px; }

        .node-actions { display: flex; gap: 8px; }
        .node-btn { width: 32px; height: 32px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .edit { background: #eff6ff; color: #3b82f6; }
        .delete { background: #fff1f1; color: #ef4444; }
        .node-btn:hover { transform: scale(1.1); }

        .node-description { margin-bottom: 24px; min-height: 60px; }
        .node-description p { margin: 0; font-size: 14px; color: #64748b; line-height: 1.6; font-weight: 500; }

        .node-footer { border-top: 1px solid var(--brand-slate-50); padding-top: 20px; }
        .curriculum-tag { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        
        .category-tag {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .category-tag.core { background: #ecfdf5; color: #10b981; border: 1px solid #d1fae5; }
        .category-tag.elective { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }

        .empty-catalog { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 100px; color: #cbd5e1; }

        .premium-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .premium-modal-content { background: white; padding: 40px; border-radius: 32px; box-shadow: 0 25px 50px rgba(0,0,0,0.1); }

        .premium-label { display: block; font-size: 13px; font-weight: 800; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .premium-input {
          width: 100%; padding: 14px 18px; border-radius: 16px; border: 1.5px solid var(--brand-slate-100);
          background: var(--brand-slate-50); font-weight: 700; color: #1e293b; outline: none; transition: all 0.2s;
        }
        .premium-input:focus { border-color: var(--brand-green); background: white; }

        .premium-btn-primary {
          background: linear-gradient(135deg, var(--brand-green), #059669); color: white; padding: 14px 28px;
          border-radius: 16px; border: none; font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.3s;
        }
        .premium-btn-secondary {
          background: var(--brand-slate-50); color: #64748b; padding: 14px 28px; border: none;
          border-radius: 16px; font-weight: 800; font-size: 15px; cursor: pointer;
        }

        .modal-title { font-size: 24px; fontWeight: 900; color: #0f172a; margin: 0; letterSpacing: -1px; }
        .modal-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; font-weight: 500; }

        .premium-loader {
          width: 48px; height: 48px; border: 5px solid var(--brand-slate-50); border-top: 5px solid var(--brand-green);
          border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Subjects;
