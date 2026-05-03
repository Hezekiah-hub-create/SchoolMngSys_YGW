import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicClassesAPI, academicSubjectsAPI, academicSectionsAPI, teacherAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';
import PremiumSelect from '../../components/common/PremiumSelect';

const displayGrade = (g) => {
  if (!g) return 'N/A';
  let str = g.toString().trim();
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

const Classes = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'ITSupport';
  const [activeMenu, setActiveMenu] = useState('Academic');
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showSectionMasterModal, setShowSectionMasterModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [classFormData, setClassFormData] = useState({ name: '', class_master_id: '', academic_year: '2024/2025' });
  const [sectionFormData, setSectionFormData] = useState({ name: '', class_id: '', class_master_id: '' });
  const [subjectFormData, setSubjectFormData] = useState({ subjectIds: [] });
  const [masterFormData, setMasterFormData] = useState({ class_master_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes, subjectsRes] = await Promise.all([
        academicClassesAPI.getAll(),
        teacherAPI.getAll({ limit: 500 }),
        academicSubjectsAPI.getAll()
      ]);
      
      setClasses(classesRes.data?.data || []);
      setTeachers(teachersRes.data?.data || []);
      setAllSubjects(subjectsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching academic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await academicClassesAPI.create(classFormData);
      setShowClassModal(false);
      setClassFormData({ name: '', class_master_id: '', academic_year: '2024/2025' });
      fetchData();
    } catch (error) {
      alert('Failed to create class. Make sure the database tables exist.');
    } finally {
      setSaving(false);
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await academicSectionsAPI.create({ ...sectionFormData, class_id: selectedClass.id });
      setShowSectionModal(false);
      setSectionFormData({ name: '', class_id: '' });
      fetchData();
    } catch (error) {
      alert('Failed to create section.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubjectAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await academicClassesAPI.assignSubjects(selectedClass.id, subjectFormData.subjectIds);
      setShowSubjectModal(false);
      setSubjectFormData({ subjectIds: [] });
      fetchData();
    } catch (error) {
      alert('Failed to assign subjects.');
    } finally {
      setSaving(false);
    }
  };

  const handleSectionMasterSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await academicSectionsAPI.update(selectedSection.id, masterFormData);
      setShowSectionMasterModal(false);
      setMasterFormData({ class_master_id: '' });
      fetchData();
    } catch (error) {
      alert('Failed to assign section master.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally { 
      localStorage.removeItem('authToken'); 
      localStorage.removeItem('authUser'); 
      navigate('/login'); 
    }
  };

  const getTeacherName = (id) => {
    const t = teachers.find(t => t.id === id);
    if (!t) return 'Not Assigned';
    return `${t.firstName || t.first_name || ''} ${t.lastName || t.last_name || ''}`.trim() || 'Unnamed Faculty';
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
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Institutional Flow</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Academic Hierarchy</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Academic <span style={{ color: 'var(--brand-green)' }}>Classes</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Manage grade levels, assign Class Masters, and configure subjects.</p>
            </div>
            {isAdmin && (
              <button onClick={() => setShowClassModal(true)} className="premium-btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Enroll New Class
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <p className="premium-label" style={{ marginBottom: '12px' }}>Active Grade Levels</p>
              <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{classes.length}</p>
              <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--brand-green)', borderRadius: '2px', marginTop: '16px' }}></div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <p className="premium-label" style={{ marginBottom: '12px' }}>Total Sections</p>
              <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{classes.reduce((sum, c) => sum + (c.sections?.length || 0), 0)}</p>
              <div style={{ width: '40px', height: '4px', backgroundColor: '#3b82f6', borderRadius: '2px', marginTop: '16px' }}></div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <p className="premium-label" style={{ marginBottom: '12px' }}>Section Master Assignments</p>
              <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>
                {classes.reduce((sum, c) => sum + (c.sections?.filter(s => s.class_master_id).length || 0), 0)}
              </p>
              <div style={{ width: '40px', height: '4px', backgroundColor: '#facc15', borderRadius: '2px', marginTop: '16px' }}></div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px' }}><div className="premium-loader"></div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
              {classes.map((cls) => (
                <div key={cls.id} className="glass-card class-node">
                  <div className="node-header">
                    <div className="node-icon">{cls.name.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <h3 className="node-title">{displayGrade(cls.name)}</h3>
                      <div className="master-assignment">
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Academic Tier Configuration</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div className="session-badge">{cls.academic_year}</div>
                    </div>
                  </div>

                  <div className="node-content">
                    <div className="content-segment">
                      <div className="segment-header">
                        <span className="segment-label">Divisional Sections</span>
                        {isAdmin && <button onClick={() => { setSelectedClass(cls); setShowSectionModal(true); }} className="node-action-btn">+</button>}
                      </div>
                      <div className="pill-container">
                        {cls.sections?.length > 0 ? cls.sections.map(s => (
                          <div key={s.id} className="section-pill-container" onClick={() => { 
                            if (!isAdmin) return;
                            setSelectedSection(s); 
                            setSelectedClass(cls); 
                            setMasterFormData({ class_master_id: s.class_master_id || '' }); 
                            setShowSectionMasterModal(true); 
                          }}>
                            <span className={`glass-pill section-pill ${!isAdmin ? 'readonly' : ''}`}>Section {s.name}</span>
                            <div className="section-master-hint">{getTeacherName(s.class_master_id)}</div>
                          </div>
                        )) : <span className="empty-state">No divisions configured</span>}
                      </div>
                    </div>

                    <div className="content-segment">
                      <div className="segment-header">
                        <span className="segment-label">Curriculum Subjects</span>
                        {isAdmin && <button onClick={() => { setSelectedClass(cls); setSubjectFormData({ subjectIds: cls.subjects?.map(s => s.id) || [] }); setShowSubjectModal(true); }} className="node-action-btn">+</button>}
                      </div>
                      <div className="pill-container">
                        {cls.subjects?.length > 0 ? cls.subjects.map(s => (
                          <span key={s.id} className="glass-pill subject-pill">{s.name}</span>
                        )) : <span className="empty-state">Curriculum pending</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals - Using Premium Styles */}
      {showClassModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 className="modal-title">Enroll Grade Level</h3>
                <p className="modal-subtitle">Define a new academic tier in the institution.</p>
              </div>
              <button onClick={() => setShowClassModal(false)} className="premium-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleClassSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label className="premium-label">Grade Nomenclature</label>
                <input className="premium-input" value={classFormData.name} onChange={e => setClassFormData({...classFormData, name: e.target.value})} placeholder="e.g. Basic 1" required />
              </div>
              <div style={{ marginBottom: '32px' }}>
                <PremiumSelect
                  label="class_master_id"
                  value={sectionFormData.class_master_id}
                  onChange={(e) => setSectionFormData({...sectionFormData, class_master_id: e.target.value})}
                  options={teachers.map(t => ({ value: t.id, label: `${t.firstName || t.first_name} ${t.lastName || t.last_name}` }))}
                  placeholder="Awaiting Assignment"
                />
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Processing...' : 'Confirm Enrollment'}</button>
                <button type="button" onClick={() => setShowClassModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Dismiss</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 className="modal-title">New Division</h3>
                <p className="modal-subtitle">Add section to {selectedClass?.name}</p>
              </div>
              <button onClick={() => setShowSectionModal(false)} className="premium-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSectionSubmit}>
              <div style={{ marginBottom: '32px' }}>
                <label className="premium-label">Section Designation</label>
                <input className="premium-input" value={sectionFormData.name} onChange={e => setSectionFormData({...sectionFormData, name: e.target.value})} placeholder="e.g. Section C" required />
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Creating...' : 'Deploy Section'}</button>
                <button type="button" onClick={() => setShowSectionModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubjectModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h3 className="modal-title">Curriculum Mapping</h3>
                <p className="modal-subtitle">Mapping subjects for {selectedClass?.name}</p>
              </div>
              <button onClick={() => setShowSubjectModal(false)} className="premium-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSubjectAssign}>
              <div className="subject-selection-grid">
                {allSubjects.map(sub => (
                  <label key={sub.id} className={`subject-checkbox-card ${subjectFormData.subjectIds.includes(sub.id) ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      style={{ display: 'none' }}
                      checked={subjectFormData.subjectIds.includes(sub.id)}
                      onChange={e => {
                        const ids = e.target.checked 
                          ? [...subjectFormData.subjectIds, sub.id]
                          : subjectFormData.subjectIds.filter(id => id !== sub.id);
                        setSubjectFormData({ subjectIds: ids });
                      }}
                    />
                    <div className="checkbox-dot"></div>
                    <div className="subject-info">
                      <span className="subject-name">{sub.name}</span>
                      <span className="subject-code">{sub.code || 'Master'}</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="modal-footer" style={{ marginTop: '30px' }}>
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Syncing...' : 'Update Curriculum'}</button>
                <button type="button" onClick={() => setShowSubjectModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Dismiss</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSectionMasterModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 className="modal-title">Section Leadership</h3>
                <p className="modal-subtitle">Assign Master for {selectedClass?.name} - {selectedSection?.name}</p>
              </div>
              <button onClick={() => setShowSectionMasterModal(false)} className="premium-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSectionMasterSubmit}>
              <div style={{ marginBottom: '32px' }}>
                <PremiumSelect
                  label="class_master_id"
                  value={masterFormData.class_master_id}
                  onChange={(e) => setMasterFormData({ class_master_id: e.target.value })}
                  options={teachers.map(t => ({ value: t.id, label: `${t.firstName || t.first_name} ${t.lastName || t.last_name}` }))}
                  placeholder="Awaiting Nomination"
                />
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Appointing...' : 'Confirm Appointment'}</button>
                <button type="button" onClick={() => setShowSectionMasterModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Cancel</button>
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .class-node:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 20px 50px rgba(0, 132, 62, 0.05);
          border-color: rgba(0, 132, 62, 0.2);
        }

        .node-header {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid var(--brand-slate-50);
        }

        .node-icon {
          width: 54px;
          height: 54px;
          background: linear-gradient(135deg, var(--brand-green), #10b981);
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 20px;
          box-shadow: 0 8px 20px rgba(0, 132, 62, 0.2);
        }

        .node-title {
          margin: 0;
          fontSize: 20px;
          fontWeight: 900;
          color: #0f172a;
          letterSpacing: -0.5px;
        }

        .master-assignment {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .session-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 4px 10px;
          background: var(--brand-slate-50);
          color: var(--brand-slate-500);
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .node-content { padding: 24px; }

        .content-segment { margin-bottom: 24px; }
        .content-segment:last-child { margin-bottom: 0; }

        .segment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .segment-label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .node-action-btn {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          border: none;
          background: var(--brand-slate-50);
          color: #64748b;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.2s;
        }

        .node-action-btn:hover {
          background: var(--brand-green);
          color: white;
          transform: scale(1.1);
        }

        .node-master-btn {
          padding: 6px 12px;
          border-radius: 10px;
          border: none;
          background: #f0fdf4;
          color: var(--brand-green);
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .node-master-btn:hover {
          background: var(--brand-green);
          color: white;
          transform: translateY(-2px);
        }

        .pill-container {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .section-pill-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .section-pill-container:hover { transform: translateY(-2px); }

        .section-master-hint {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          padding-left: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }

        .glass-pill {
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          backdrop-filter: blur(5px);
        }

        .section-pill { background: rgba(16, 185, 129, 0.1); color: #065f46; border: 1px solid rgba(16, 185, 129, 0.1); }
        .subject-pill { background: rgba(59, 130, 246, 0.1); color: #1e40af; border: 1px solid rgba(59, 130, 246, 0.1); }

        .empty-state { font-size: 12px; color: #cbd5e1; font-style: italic; }

        .premium-btn-primary {
          background: linear-gradient(135deg, var(--brand-green), #059669);
          color: white;
          padding: 12px 24px;
          border-radius: 16px;
          border: none;
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 20px rgba(0, 132, 62, 0.2);
        }

        .premium-btn-secondary {
          background: white;
          color: #64748b;
          padding: 12px 24px;
          border-radius: 16px;
          border: 1.5px solid var(--brand-slate-100);
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .premium-label {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .premium-input {
          width: 100%;
          padding: 14px 18px;
          border-radius: 16px;
          border: 1.5px solid var(--brand-slate-100);
          background: var(--brand-slate-50);
          font-weight: 700;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }
        .premium-input:focus { border-color: var(--brand-green); background: white; }

        .subject-selection-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
          max-height: 350px;
          overflow-y: auto;
          padding: 4px;
        }

        .subject-checkbox-card {
          padding: 14px;
          background: var(--brand-slate-50);
          border: 1.5px solid var(--brand-slate-100);
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .subject-checkbox-card.active {
          background: #ecfdf5;
          border-color: var(--brand-green);
        }

        .checkbox-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #cbd5e1;
          transition: all 0.2s;
        }

        .active .checkbox-dot {
          background: var(--brand-green);
          border-color: var(--brand-green);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .subject-info { display: flex; flexDirection: column; }
        .subject-name { font-size: 13px; fontWeight: 800; color: #1e293b; }
        .subject-code { font-size: 10px; fontWeight: 700; color: #94a3b8; textTransform: uppercase; }

        .modal-title { font-size: 24px; fontWeight: 900; color: #0f172a; margin: 0; letterSpacing: -1px; }
        .modal-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; font-weight: 500; }
        
        .premium-loader {
          width: 48px;
          height: 48px;
          border: 5px solid var(--brand-slate-50);
          border-top: 5px solid var(--brand-green);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Classes;
