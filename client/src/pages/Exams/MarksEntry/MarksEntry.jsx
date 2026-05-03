import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { studentAPI, courseAPI, gradeAPI, settingsAPI } from '../../../services/api';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import TopNav from '../../../components/layout/TopNav';
import PremiumSelect from '../../../components/common/PremiumSelect';

const displayGrade = (g) => {
  if (!g) return 'No Grade';
  let str = g.toString().trim();
  // Transform Primary 1-6 to Basic 1-6 for UI display
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

// Premium Icon Components
const Icons = {
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Save: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Refresh: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

const MarksEntry = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Exams');

  // Role-based access control
  const currentUser = user || JSON.parse(localStorage.getItem('authUser') || '{}');
  const isTeacher = currentUser?.role === 'teacher';
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isTeacher; // Only teachers can enter marks
  
  const [filters, setFilters] = useState({
    grade: '',
    section: '',
    courseId: '',
    term: '1st'
  });
  
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInitialData();
  }, [user, navigate]);

  const fetchInitialData = async () => {
    try {
      const [settingsRes, coursesRes] = await Promise.all([
        settingsAPI.getSettings(),
        courseAPI.getAll()
      ]);
      
      if (settingsRes.data.success) {
        setSettings(settingsRes.data.settings);
        setFilters(prev => ({ 
          ...prev, 
          term: settingsRes.data.settings.currentTerm || '1st'
        }));
      }
      
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data);
      }
    } catch (error) { console.error('Error fetching initial data:', error); }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const loadStudents = async () => {
    if (!filters.grade || !filters.courseId) return;

    try {
      setLoading(true);
      setCurrentPage(1); // Reset to first page on new load
      const currentYear = settings?.currentSession || '2024/2025';
      
      // Find all courses with the same name in this grade to merge their grades
      const selectedCourse = courses.find(c => c.id === filters.courseId || c._id === filters.courseId);
      const matchingCourseIds = selectedCourse 
        ? courses.filter(c => c.grade === filters.grade && c.name.toLowerCase().trim() === selectedCourse.name.toLowerCase().trim()).map(c => c.id || c._id)
        : [filters.courseId];

      const [studentsRes, ...gradesResponses] = await Promise.all([
        studentAPI.getAll({ grade: filters.grade, section: filters.section }),
        ...matchingCourseIds.map(id => gradeAPI.getByCourse(id, { term: filters.term, academicYear: currentYear }))
      ]);

      if (studentsRes.data.success) {
        const studentList = studentsRes.data.data;
        setStudents(studentList);
        
        const allGrades = gradesResponses.flatMap(res => res.data?.data || []);
        
        const initialMarks = {};
        studentList.forEach(s => {
          const sId = s.id || s._id;

          // Get ALL matching grade records for this student (can be multiple from different sections)
          const matchingGrades = allGrades.filter(g =>
            (g.student === sId || g.student_id === sId) &&
            g.term === filters.term &&
            (g.academic_year === currentYear || g.academicYear === currentYear)
          );

          // Pick the most recently updated one (teacher's latest entry wins)
          const existingGrade = matchingGrades.length > 0
            ? matchingGrades.sort((a, b) =>
                new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
              )[0]
            : null;
          
          if (existingGrade) {
            const assessments = existingGrade.assessments || [];
            const classScore = assessments.find(a => a.name === 'Class Score')?.score || 0;
            const examScore = assessments.find(a => a.name === 'Exam Score')?.score || 0;
            
            initialMarks[sId] = {
              classScore, examScore,
              id: existingGrade.id || existingGrade._id,
              courseId: existingGrade.course_id || existingGrade.course || filters.courseId
            };
          } else {
            initialMarks[sId] = { classScore: 0, examScore: 0, courseId: filters.courseId };
          }
        });
        setMarks(initialMarks);
        setLastUpdated(new Date());

      }
    } catch (error) { console.error('Error loading students:', error); }
    finally { setLoading(false); }
  };

  const handleMarkChange = (studentId, field, value) => {
    const val = Math.min(50, Math.max(0, parseInt(value) || 0));
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: val }
    }));
  };


  const calculateTotal = (studentId) => {
    const m = marks[studentId];
    if (!m) return 0;
    return (m.classScore || 0) + (m.examScore || 0);
  };


  const getGrade = (total) => {
    if (!settings || !settings.gradingSystem) return total >= 70 ? 'A' : total >= 60 ? 'B' : total >= 50 ? 'C' : 'F';
    const gradeItem = settings.gradingSystem.find(g => total >= g.minScore && total <= g.maxScore);
    return gradeItem ? gradeItem.grade : 'F';
  };

  const submitMarks = async () => {
    try {
      setSaving(true);
      const currentYear = settings?.currentSession || '2024/2025';
      console.log('Submitting marks with academic_year:', currentYear, 'term:', filters.term);
      
      const gradesToSubmit = students.map(s => {
        const sId = s.id || s._id;
        const m = marks[sId] || { classScore: 0, examScore: 0, courseId: filters.courseId };
        const total = calculateTotal(sId);
        return {
          id: m.id,
          student_id: sId,
          student_name: `${s.firstName || s.first_name} ${s.lastName || s.last_name}`,
          course_id: m.courseId || filters.courseId,
          course_name: courses.find(c => (c.id === (m.courseId || filters.courseId) || c._id === (m.courseId || filters.courseId)))?.name,
          academic_year: currentYear,
          term: filters.term,
          classScore: m.classScore || 0,
          examScore: m.examScore || 0,
          score: total,
          grade: getGrade(total)
        };
      });


      console.log('Grades to submit:', gradesToSubmit);
      
      const response = await gradeAPI.submitBatch({ grades: gradesToSubmit });
      console.log('Submit response:', response.data);
      if (response.data.success) {
        let msg = `Marks submitted successfully! ${response.data.count} records saved.`;
        if (response.data.failed && response.data.failed.length > 0) {
          msg += `\n\nFailed to save ${response.data.failed.length} records. Check console for details.`;
          console.error('Failed grades:', response.data.failed);
        }
        alert(msg);
        loadStudents();
      } else {
        alert('Error: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) { 
      console.error('Error submitting marks:', error); 
      alert('Error: ' + (error.response?.data?.message || error.message)); 
    }
    finally { setSaving(false); }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const grades = [...new Set(courses.map(c => c.grade))];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', sans-serif" }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={user} onLogout={handleLogout} />
        <main style={{ padding: '100px 40px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Assessment Node</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Academic Evaluation</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Marks <span style={{ color: 'var(--brand-green)' }}>{canEdit ? 'Entry' : 'Registry'}</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>{canEdit ? 'Process and synchronize student assessment scores for the current term.' : 'View student assessment scores. Contact the assigned teacher to make changes.'}</p>
            </div>
            {canEdit && students.length > 0 && (
              <button 
                onClick={submitMarks}
                disabled={saving}
                className="premium-btn-primary"
                style={{ padding: '16px 32px' }}
              >
                {saving ? <div className="premium-loader" style={{ width: '20px', height: '20px' }}></div> : <Icons.Save />}
                {saving ? 'Synchronizing...' : 'Finalize & Commit'}
              </button>
            )}
          </div>

          {/* Read-only banner for admins */}
          {!canEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', marginBottom: '32px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8', margin: 0 }}>View-Only Mode — You are viewing this as an Administrator. Only assigned teachers can enter or modify student marks.</p>
            </div>
          )}


          <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="premium-label">Academic Grade</label>
              <PremiumSelect 
                name="grade"
                value={filters.grade}
                onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                options={grades.map(g => ({ value: g, label: displayGrade(g) }))}
                placeholder="Select Grade Level"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="premium-label">Curriculum Subject</label>
              <PremiumSelect 
                name="courseId"
                value={filters.courseId}
                onChange={(e) => setFilters(prev => ({ ...prev, courseId: e.target.value }))}
                options={courses.filter(c => !filters.grade || c.grade === filters.grade)
                  .filter((c, index, self) => 
                    index === self.findIndex((t) => (
                      t.name === c.name
                    ))
                  )
                  .map(c => ({ value: c.id || c._id, label: c.name }))}
                placeholder="Select Course"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="premium-label">Reporting Term</label>
              <PremiumSelect 
                name="term"
                value={filters.term}
                onChange={(e) => setFilters(prev => ({ ...prev, term: e.target.value }))}
                options={[
                  { value: '1st', label: 'First Academic Term' },
                  { value: '2nd', label: 'Second Academic Term' },
                  { value: '3rd', label: 'Third Academic Term' }
                ]}
                placeholder="Select Term"
              />
            </div>
            <button 
              onClick={loadStudents}
              disabled={loading || !filters.grade || !filters.courseId}
              className="premium-btn-secondary"
              style={{ height: '48px', padding: '0 24px', opacity: (loading || !filters.grade || !filters.courseId) ? 0.6 : 1 }}
            >
              {loading ? <div className="premium-loader" style={{ width: '18px', height: '18px' }}></div> : <Icons.Search />}
              {canEdit ? 'Initialize Sheet' : 'Load Registry'}
            </button>
          </div>


          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--brand-slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                  {students.length > 0 ? `${filters.grade} — ${courses.find(c => c.id === filters.courseId)?.name}` : 'Grade Ledger Matrix'}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                  {students.length > 0 
                    ? (canEdit ? `Processing registry for ${students.length} scholars.` : `Viewing live marks for ${students.length} scholars.`)
                    : (canEdit ? 'Synchronize registry to begin evaluation.' : 'Select grade, subject and term, then click Load Registry.')}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {lastUpdated && (
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                    {canEdit ? 'Last saved' : 'Live data as of'}: {lastUpdated.toLocaleTimeString()}
                    {!canEdit && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', marginLeft: '6px', verticalAlign: 'middle' }}></span>}
                  </span>
                )}
                {students.length > 0 && (
                  <button onClick={loadStudents} className="premium-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    <Icons.Refresh /> {canEdit ? 'Refresh Registry' : 'Reload'}
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--brand-slate-50)' }}>
                    <th className="premium-th">Scholar Identity</th>
                    <th className="premium-th">Class Score (50)</th>
                    <th className="premium-th">Exam Score (50)</th>
                    <th className="premium-th">Aggregate Score (100)</th>
                    <th className="premium-th">Classification</th>
                  </tr>

                </thead>

                <tbody>
                  {students.length > 0 ? students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((s) => {
                    const sId = s.id || s._id;
                    const total = calculateTotal(sId);
                    const grade = getGrade(total);
                    return (
                      <tr key={sId} className="premium-row" style={{ borderBottom: '1px solid var(--brand-slate-100)' }}>
                        <td style={{ padding: '20px 24px' }}>
                          <p style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>{s.firstName || s.first_name} {s.lastName || s.last_name}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', fontWeight: '600' }}>ID: {s.admissionNumber || s.admission_number}</p>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          {canEdit
                            ? <input type="number" max="50" value={marks[sId]?.classScore || 0} onChange={(e) => handleMarkChange(sId, 'classScore', e.target.value)} className="premium-input" style={{ width: '100px', textAlign: 'center', fontWeight: '900', fontSize: '18px', color: 'var(--brand-green)', padding: '8px' }} />
                            : <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{marks[sId]?.classScore ?? 0}</span>
                          }
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          {canEdit
                            ? <input type="number" max="50" value={marks[sId]?.examScore || 0} onChange={(e) => handleMarkChange(sId, 'examScore', e.target.value)} className="premium-input" style={{ width: '100px', textAlign: 'center', fontWeight: '900', fontSize: '18px', color: 'var(--brand-green)', padding: '8px' }} />
                            : <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{marks[sId]?.examScore ?? 0}</span>
                          }
                        </td>

                        <td style={{ padding: '20px 24px' }}>
                          <p style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{total}</p>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ 
                              padding: '6px 14px', 
                              borderRadius: '12px', 
                              fontSize: '12px', 
                              fontWeight: '900',
                              backgroundColor: total >= 70 ? '#ecfdf5' : total >= 50 ? '#fefce8' : '#fef2f2',
                              color: total >= 70 ? '#10b981' : total >= 50 ? '#ca8a04' : '#ef4444',
                              border: `1px solid ${total >= 70 ? '#d1fae5' : total >= 50 ? '#fef08a' : '#fee2e2'}`
                            }}>{grade}</span>
                            {total >= 40 && <div style={{ color: '#10b981' }}><Icons.Check /></div>}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '120px 40px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--brand-slate-200)', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}><Icons.FileText /></div>
                        <p style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Ledger Uninitialized</p>
                        <p style={{ fontSize: '15px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Configure academic parameters and initialize the sheet to begin data entry.</p>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>

              {/* Pagination UI */}
              {students.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px', padding: '12px' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#1e293b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {Array.from({ length: Math.ceil(students.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: currentPage === page ? '#00843e' : 'transparent', color: currentPage === page ? 'white' : '#64748b', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(students.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(students.length / itemsPerPage)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#1e293b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: currentPage === Math.ceil(students.length / itemsPerPage) ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input:focus { border-color: #00843e !important; box-shadow: 0 0 0 4px rgba(0, 132, 62, 0.1) !important; outline: none !important; }
      `}</style>
    </div>
  );
};

export default MarksEntry;
