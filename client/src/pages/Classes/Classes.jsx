import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicClassesAPI, academicSubjectsAPI, academicSectionsAPI, teacherAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PremiumSelect from '../../components/common/PremiumSelect';
import { useAlert } from '../../context/AlertContext';

const displayGrade = (g) => {
  if (!g) return 'N/A';
  let str = g.toString().trim();
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  const jhsMatch = str.match(/^JHS\s*([1-3])$/i);
  if (jhsMatch) return `Basic ${parseInt(jhsMatch[1]) + 6}`;
  return str;
};

const Classes = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'ITSupport';
  const isTeacher = user?.role === 'teacher';
  const [activeMenu, setActiveMenu] = useState('Academic');
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([])
  const [teacherClassNames, setTeacherClassNames] = useState(new Set()); // grades the teacher is assigned to
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
  const [sectionFormData, setSectionFormData] = useState({ name: 'A', class_id: '', class_master_id: '' });
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [subjectFormData, setSubjectFormData] = useState({ subjectIds: [] });
  const [masterFormData, setMasterFormData] = useState({ class_master_id: '' });
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [classesRes, teachersRes, subjectsRes] = await Promise.all([
        academicClassesAPI.getAll(),
        teacherAPI.getAll({ limit: 500 }),
        academicSubjectsAPI.getAll()
      ]);
      
      setClasses(classesRes.data?.data || []);
      setTeachers(teachersRes.data?.data || []);
      setAllSubjects(subjectsRes.data?.data || []);

      // If teacher role, fetch their assigned courses to know which classes belong to them
      if (isTeacher) {
        try {
          const coursesRes = await teacherAPI.getMyCourses();
          const myCourses = coursesRes?.data?.data || coursesRes?.data || [];
          const myGrades = new Set(myCourses.filter(c => c.grade).map(c => c.grade.toLowerCase().trim()));
          setTeacherClassNames(myGrades);
        } catch (e) {
          console.warn('Could not fetch teacher courses for class filter:', e);
        }
      }
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
      showAlert({
        title: 'Enrollment Error',
        message: 'Failed to create class. Make sure the database tables exist.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSectionId) {
        await academicSectionsAPI.update(editingSectionId, sectionFormData);
      } else {
        await academicSectionsAPI.create({ ...sectionFormData, class_id: selectedClass.id });
      }
      setShowSectionModal(false);
      setEditingSectionId(null);
      setSectionFormData({ name: 'A', class_id: '', class_master_id: '' });
      fetchData();
    } catch (error) {
      showAlert({
        title: 'Section Error',
        message: 'Failed to save section.',
        type: 'error'
      });
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
      fetchData(true);
    } catch (error) {
      showAlert({
        title: 'Curriculum Error',
        message: 'Failed to update curriculum.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubjectRemove = async (classId, subjectId, subjectName) => {
    showAlert({
      title: 'Confirm Removal',
      message: `Are you sure you want to remove ${subjectName} from this class?`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          const cls = classes.find(c => c.id === classId);
          const updatedIds = cls.subjects.filter(s => s.id !== subjectId).map(s => s.id);
          await academicClassesAPI.assignSubjects(classId, updatedIds);
          fetchData(true);
        } catch (error) {
          showAlert({
            title: 'System Error',
            message: 'Failed to remove subject.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleAutoAllocateGES = async (gradeName) => {
    try {
      const res = await courseAPI.autoAllocate({ grade: gradeName, academicYear: '2024/2025' });
      if (res.data?.success) {
        showAlert({
          title: 'GES Curriculum Mapped',
          message: res.data.message || `Successfully mapped default GES subjects for ${gradeName}.`,
          type: 'success'
        });
        fetchData(true);
      } else {
        showAlert({
          title: 'Mapping Failed',
          message: res.data?.message || 'Failed to auto-allocate GES curriculum.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      showAlert({
        title: 'System Error',
        message: err.response?.data?.message || 'Failed to communicate with institutional allocation system.',
        type: 'error'
      });
    }
  };

  const handleClassDelete = async (classId, className) => {
    showAlert({
      title: 'Dangerous Operation',
      message: `CAUTION: Deleting ${className} will remove all related sections and subject assignments. Proceed?`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          setSaving(true);
          await academicClassesAPI.delete(classId);
          fetchData();
        } catch (error) {
          showAlert({
            title: 'Action Failed',
            message: 'Failed to delete class.',
            type: 'error'
          });
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleSectionDelete = async (sectionId, sectionName) => {
    showAlert({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete Section ${sectionName}? This will remove all student associations with this specific section node.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          setSaving(true);
          await academicSectionsAPI.delete(sectionId);
          fetchData();
        } catch (error) {
          showAlert({
            title: 'Action Failed',
            message: 'Failed to delete section.',
            type: 'error'
          });
        } finally {
          setSaving(false);
        }
      }
    });
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
      showAlert({
        title: 'Assignment Error',
        message: 'Failed to assign section master.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally { 
      localStorage.removeItem('authUser'); 
      navigate('/login'); 
    }
  };

  const getTeacherName = (id) => {
    const t = teachers.find(t => t.id === id);
    if (!t) return 'Not Assigned';
    return `${t.firstName || t.first_name || ''} ${t.lastName || t.last_name || ''}`.trim() || 'Unnamed Faculty';
  };

  const displayedClasses = isTeacher
    ? classes.filter(cls => {
        const nameMatch = teacherClassNames.has(cls.name?.toLowerCase()?.trim()) ||
          teacherClassNames.has(displayGrade(cls.name)?.toLowerCase()?.trim());
        const masterMatch = cls.sections?.some(sec => sec.class_master_id === user?.id || sec.class_master_id === user?._id);
        return nameMatch || masterMatch;
      })
    : classes;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <main style={{ padding: '0 0 60px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Institutional Flow</span>
              <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Hierarchy</span>
            </div>
            <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>
              {isTeacher ? 'My ' : 'Academic '}<span style={{ color: 'var(--brand-green)' }}>Classes</span>
            </h1>
            <p style={{ fontSize: '17px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>
              {isTeacher ? 'Overview of classes, divisions, and curricula assigned to you.' : 'Manage grade levels, assign Class Masters, and configure subjects.'}
            </p>
          </div>
        </div>

        <div className="responsive-grid-3" style={{ marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <p className="premium-label" style={{ marginBottom: '12px' }}>{isTeacher ? 'My Active Classes' : 'Active Grade Levels'}</p>
            <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{displayedClasses.length}</p>
            <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--brand-green)', borderRadius: '2px', marginTop: '16px' }}></div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <p className="premium-label" style={{ marginBottom: '12px' }}>Total Sections</p>
            <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{displayedClasses.reduce((sum, c) => sum + (c.sections?.length || 0), 0)}</p>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#3b82f6', borderRadius: '2px', marginTop: '16px' }}></div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <p className="premium-label" style={{ marginBottom: '12px' }}>Section Master Assignments</p>
            <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>
              {displayedClasses.reduce((sum, c) => sum + (c.sections?.filter(s => s.class_master_id).length || 0), 0)}
            </p>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#facc15', borderRadius: '2px', marginTop: '16px' }}></div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}><div className="premium-loader"></div></div>
        ) : displayedClasses.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', marginTop: '20px' }}>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#64748b' }}>No classes currently assigned to your account.</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Contact the institutional administrator to assign classes or courses to your profile.</p>
          </div>
        ) : (
          <div className="responsive-grid-2" style={{ gap: '32px' }}>
            {displayedClasses.map((cls) => (
              <div key={cls.id} className="class-node">
                {isAdmin && (
                  <button onClick={() => handleClassDelete(cls.id, cls.name)} className="node-delete-trigger" title="Remove Class">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                )}

                <div className="node-header">
                  <div className="node-icon">
                    {cls.name.toLowerCase().includes('basic') ? 'B' : 
                     cls.name.toLowerCase().includes('jhs') ? 'J' : 
                     cls.name.toLowerCase().includes('primary') ? 'P' :
                     cls.name.toLowerCase().includes('kg') ? 'K' :
                     cls.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="node-title">{displayGrade(cls.name)}</h3>
                    <div className="node-meta">
                      <span className="academic-year-badge">{cls.academic_year}</span>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-slate-200)' }}></div>
                      <span className="meta-tag">{(cls.sections?.length || 0)} Divisions</span>
                    </div>
                  </div>
                </div>

                <div className="node-content">
                  {/* Sections Segment */}
                  <div className="content-segment">
                    <div className="segment-header">
                      <div className="segment-info">
                        <div className="segment-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="4"/></svg>
                        </div>
                        <span className="segment-label">Assigned Sections</span>
                      </div>
                      {isAdmin && (
                        <button onClick={() => { setSelectedClass(cls); setSectionFormData({ name: '', class_id: cls.id }); setShowSectionModal(true); }} className="segment-add-btn">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      )}
                    </div>
                    <div className="badge-grid">
                      {cls.sections && cls.sections.length > 0 ? cls.sections.map(sec => (
                        <div 
                          key={sec.id} 
                          className="premium-badge" 
                          style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                          onClick={() => {
                            if (isAdmin) {
                              setSelectedClass(cls);
                              setSelectedSection(sec);
                              setEditingSectionId(sec.id);
                              setSectionFormData({ name: sec.name || 'A', class_id: cls.id, class_master_id: sec.class_master_id || '' });
                              setShowSectionModal(true);
                            }
                          }}
                        >
                          <div className="badge-dot" style={{ background: 'var(--brand-green)' }}></div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="badge-text" style={{ fontSize: '14px' }}>Section {sec.name}</span>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>{getTeacherName(sec.class_master_id)}</span>
                          </div>
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); handleSectionDelete(sec.id, sec.name); }} className="badge-delete" style={{ marginLeft: '4px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      )) : <span className="empty-state">No sections defined</span>}
                    </div>
                  </div>

                  {/* Curriculum Segment */}
                  <div className="content-segment">
                    <div className="segment-header">
                      <div className="segment-info">
                        <div className="segment-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        </div>
                        <span className="segment-label">Academic Curriculum</span>
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleAutoAllocateGES(cls.name)} 
                            className="segment-add-btn" 
                            title="Auto-map GES subjects"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                          </button>
                          <button onClick={() => { setSelectedClass(cls); setSubjectFormData({ subjectIds: (cls.subjects || []).map(s => s.id) }); setShowSubjectModal(true); }} className="segment-add-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="badge-grid">
                      {cls.subjects && cls.subjects.length > 0 ? cls.subjects.map(s => (
                        <div key={s.id} className="premium-badge" style={{ padding: '8px 12px' }}>
                          <div className="badge-dot" style={{ background: '#3b82f6' }}></div>
                          <span className="badge-text" style={{ fontSize: '12px' }}>{s.name}</span>
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); handleSubjectRemove(cls.id, s.id, s.name); }} className="badge-delete">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      )) : <span className="empty-state">Curriculum mapping pending</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
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
              <div className="modal-footer" style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowClassModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Dismiss</button>
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Processing...' : 'Confirm Enrollment'}</button>
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
              <div className="subject-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '40vh', overflowY: 'auto', padding: '4px' }}>
                {allSubjects.map(sub => (
                  <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1.5px solid #f1f5f9', borderRadius: '14px', cursor: 'pointer', transition: '0.2s', backgroundColor: subjectFormData.subjectIds.includes(sub.id) ? 'rgba(0, 132, 62, 0.05)' : 'white', borderColor: subjectFormData.subjectIds.includes(sub.id) ? 'var(--brand-green)' : '#f1f5f9' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green)' }} checked={subjectFormData.subjectIds.includes(sub.id)} onChange={e => {
                      const ids = e.target.checked ? [...subjectFormData.subjectIds, sub.id] : subjectFormData.subjectIds.filter(id => id !== sub.id);
                      setSubjectFormData({ subjectIds: ids });
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{sub.name}</span>
                  </label>
                ))}
              </div>
              <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowSubjectModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Dismiss</button>
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Syncing...' : 'Update Curriculum'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 className="modal-title">{editingSectionId ? 'Edit Section' : 'Create Section'}</h3>
                <p className="modal-subtitle">{editingSectionId ? 'Update division settings' : 'Add a new division to'} {selectedClass?.name}</p>
              </div>
              <button onClick={() => { setShowSectionModal(false); setEditingSectionId(null); }} className="premium-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSectionSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label className="premium-label">Section Identifier / Division</label>
                <PremiumSelect
                  value={sectionFormData.name}
                  onChange={e => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                  options={[
                    { value: 'A', label: 'Section A (Yellow)' },
                    { value: 'B', label: 'Section B (Green)' },
                    { value: 'C', label: 'Section C (Red)' },
                    { value: 'D', label: 'Section D (Blue)' },
                    { value: 'Yellow', label: 'Yellow' },
                    { value: 'Green', label: 'Green' },
                    { value: 'Red', label: 'Red' },
                    { value: 'Blue', label: 'Blue' }
                  ]}
                  placeholder="Select Section..."
                  required
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label className="premium-label">Faculty Lead / Class Master</label>
                <PremiumSelect
                  options={[
                    { value: '', label: 'None (Unassigned)' },
                    ...teachers.map(t => ({ value: t.id, label: `${t.firstName || t.first_name || ''} ${t.lastName || t.last_name || ''}`.trim() }))
                  ]}
                  value={sectionFormData.class_master_id || ''}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, class_master_id: e.target.value })}
                  placeholder="Designate Section Master..."
                />
              </div>

              <div className="modal-footer" style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setShowSectionModal(false); setEditingSectionId(null); }} className="premium-btn-secondary" style={{ flex: 1 }}>Dismiss</button>
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Saving...' : (editingSectionId ? 'Save Changes' : 'Finalize Section')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSectionMasterModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 className="modal-title">Assign Section Master</h3>
                <p className="modal-subtitle">Designate a faculty lead for Section {selectedSection?.name}</p>
              </div>
              <button onClick={() => setShowSectionMasterModal(false)} className="premium-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSectionMasterSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label className="premium-label">Select Faculty Master</label>
                <PremiumSelect
                  options={teachers.map(t => ({ value: t.id, label: `${t.firstName || t.first_name || ''} ${t.lastName || t.last_name || ''}`.trim() }))}
                  value={masterFormData.class_master_id}
                  onChange={(e) => setMasterFormData({ class_master_id: e.target.value })}
                  placeholder="Select a teacher..."
                  required
                />
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowSectionMasterModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Dismiss</button>
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Assigning...' : 'Confirm Assignment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .class-node { 
          background: white;
          border-radius: 32px;
          border: 1px solid var(--brand-slate-100);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .class-node:hover {
          box-shadow: 0 20px 40px rgba(0, 132, 62, 0.08);
          border-color: var(--brand-green-light);
        }

        .node-header { 
          padding: 32px; 
          display: flex; 
          align-items: center; 
          gap: 24px; 
          background: linear-gradient(to bottom, #ffffff, white);
          border-bottom: 1px solid var(--brand-slate-50);
        }

        .node-icon { 
          width: 64px; 
          height: 64px; 
          background: var(--brand-green); 
          color: white; 
          border-radius: 20px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 950; 
          font-size: 28px; 
          box-shadow: 0 10px 20px rgba(0, 132, 62, 0.2);
          transition: all 0.3s;
        }

        .node-title { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 950; 
          color: var(--brand-slate-900); 
          letter-spacing: -1px; 
        }

        .node-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
        }

        .meta-tag {
          font-size: 11px;
          font-weight: 800;
          color: var(--brand-slate-400);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .node-content { padding: 32px; flex: 1; display: flex; flex-direction: column; gap: 32px; }

        .content-segment { display: flex; flex-direction: column; gap: 16px; }

        .segment-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
        }

        .segment-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .segment-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .segment-label { 
          font-size: 12px; 
          font-weight: 900; 
          color: var(--brand-slate-900); 
          text-transform: uppercase; 
          letter-spacing: 1px; 
        }

        .badge-grid { display: flex; flex-wrap: wrap; gap: 10px; }

        .premium-badge { 
          padding: 10px 16px; 
          border-radius: 14px; 
          background: var(--brand-slate-50); 
          border: 1px solid var(--brand-slate-100);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .premium-badge:hover { 
          background: white; 
          border-color: var(--brand-green); 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); 
          transform: translateY(-2px);
        }

        .badge-dot { width: 6px; height: 6px; border-radius: 50%; }

        .badge-text { font-size: 13px; font-weight: 800; color: var(--brand-slate-800); }

        .badge-delete { 
          border: none; 
          background: none; 
          color: var(--brand-slate-300); 
          cursor: pointer; 
          padding: 0; 
          display: flex; 
          align-items: center; 
          transition: all 0.2s; 
        }

        .badge-delete:hover { color: #ef4444; }

        .segment-add-btn { 
          width: 32px; 
          height: 32px; 
          border-radius: 10px; 
          border: none; 
          background: var(--brand-slate-50); 
          color: var(--brand-slate-400); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          cursor: pointer; 
          transition: all 0.2s; 
        }

        .segment-add-btn:hover { 
          background: var(--brand-green); 
          color: white; 
          transform: scale(1.1); 
          box-shadow: 0 4px 12px rgba(0, 132, 62, 0.2);
        }

        .node-delete-trigger { 
          position: absolute;
          top: 32px;
          right: 32px;
          background: rgba(239, 68, 68, 0.05); 
          border: none; 
          color: #ef4444; 
          cursor: pointer; 
          width: 40px; 
          height: 40px; 
          border-radius: 12px; 
          transition: all 0.3s; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          opacity: 0;
          transform: scale(0.8);
        }

        .class-node:hover .node-delete-trigger { 
          opacity: 1; 
          transform: scale(1);
        }

        .node-delete-trigger:hover { 
          background: #ef4444; 
          color: white; 
          box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2);
        }

        .empty-state { 
          font-size: 12px; 
          color: var(--brand-slate-400); 
          font-style: italic; 
          font-weight: 600;
        }

        .academic-year-badge {
          background: var(--brand-slate-900);
          color: white;
          font-size: 10px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .premium-loader {
          width: 48px;
          height: 48px;
          border: 4px solid var(--brand-slate-100);
          border-top: 4px solid var(--brand-green);
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      </div>
    );
};

export default Classes;
