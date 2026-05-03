import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentAPI, attendanceAPI, gradeAPI, assignmentAPI, academicClassesAPI, academicSectionsAPI, parentAPI, courseAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import TopNav from '../../../components/layout/TopNav';
import PremiumSelect from '../../../components/common/PremiumSelect';
import PremiumDatePicker from '../../../components/common/PremiumDatePicker';

// Premium Icon Components
const Icons = {
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Award: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Book: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
};

const displayGrade = (g) => {
  if (!g) return 'No Grade';
  let str = g.toString().trim();
  // Transform Primary 1-6 to Basic 1-6 for UI display
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

const StudentProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Students');
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [dbGrades, setDbGrades] = useState([]);
  const [dbSections, setDbSections] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [curriculumCount, setCurriculumCount] = useState(0);

  useEffect(() => { 
    fetchStudentData(); 
    fetchAcademicMetadata();
  }, [id]);

  const fetchAcademicMetadata = async () => {
    try {
      const [classesRes, sectionsRes] = await Promise.all([
        academicClassesAPI.getAll(),
        academicSectionsAPI.getAll()
      ]);
      if (classesRes.data.success) setDbGrades(classesRes.data.data);
      if (sectionsRes.data.success) setDbSections(sectionsRes.data.data);
    } catch (err) {
      console.error('Error fetching academic metadata:', err);
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [studentRes, attendanceRes, gradesRes] = await Promise.allSettled([
        studentAPI.getById(id),
        attendanceAPI.getByStudent(id),
        gradeAPI.getByStudent(id)
      ]);

      if (studentRes.status === 'fulfilled' && studentRes.value?.data?.success) {
        const rawStudent = studentRes.value.data.data;
        
        // Fetch parent details if parentIds exist
        let parentName = rawStudent.parentName || rawStudent.parent_name;
        if (!parentName && rawStudent.parentIds?.length > 0) {
          try {
            const parentRes = await parentAPI.getById(rawStudent.parentIds[0]);
            if (parentRes.data?.success) {
              const p = parentRes.data.data;
              parentName = `${p.firstName || p.first_name} ${p.lastName || p.last_name}`;
            }
          } catch (e) {
            console.warn('Failed to fetch parent details', e);
          }
        }

        const normalizedStudent = {
          ...rawStudent,
          firstName: rawStudent.firstName || rawStudent.first_name,
          lastName: rawStudent.lastName || rawStudent.last_name,
          admissionNumber: rawStudent.admissionNumber || rawStudent.admission_number,
          dateOfBirth: rawStudent.dateOfBirth || rawStudent.date_of_birth,
          parentName: parentName,
          parentPhone: rawStudent.parentPhone || rawStudent.parent_phone
        };
        setStudent(normalizedStudent);

        // Fetch curriculum count for this student's grade
        if (normalizedStudent.grade) {
          try {
            const curriculumRes = await courseAPI.getAll({ grade: normalizedStudent.grade });
            if (curriculumRes.data?.success) {
              setCurriculumCount(curriculumRes.data.data.length);
            }
          } catch (e) {
            console.warn('Failed to fetch curriculum count', e);
          }
        }
      }
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value?.data?.success) {
        setAttendance(attendanceRes.value.data.data || []);
      }
      if (gradesRes.status === 'fulfilled' && gradesRes.value?.data?.success) {
        setGrades(gradesRes.value.data.data || []);
      }
    } catch (err) { console.error('Error fetching student data:', err); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { 
    try { await logout(); } 
    finally { 
      localStorage.removeItem('authToken'); 
      localStorage.removeItem('authUser'); 
      navigate('/login'); 
    } 
  };

  const startEdit = () => {
    setEditFormData({
      firstName: student?.firstName || '',
      lastName: student?.lastName || '',
      dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      gender: student?.gender || '',
      grade: student?.grade || '',
      section: student?.section || 'A',
      status: student?.status || 'active',
      address: student?.address || { street: '', city: '', region: '', country: 'Ghana' },
      emergencyContact: student?.emergencyContact || { name: '', relationship: '', phone: '', email: '' },
      medicalInfo: student?.medicalInfo || { bloodType: '', allergies: '', medicalConditions: '' }
    });
    setIsEditing(true);

    // Initial section filtering for the student's current grade
    const currentGrade = student?.grade;
    if (currentGrade && dbGrades.length > 0) {
      const selectedClass = dbGrades.find(g => g.name === currentGrade || g.id === currentGrade);
      if (selectedClass) {
        setAvailableSections(dbSections.filter(s => s.class_id === selectedClass.id));
      }
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
      
      // Filter sections if grade changes
      if (name === 'grade') {
        const selectedClass = dbGrades.find(g => g.name === value || g.id === value);
        if (selectedClass) {
          setAvailableSections(dbSections.filter(s => s.class_id === selectedClass.id));
        } else {
          setAvailableSections([]);
        }
      }
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      await studentAPI.update(id, editFormData);
      setSuccess('Student profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditing(false);
      fetchStudentData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student');
      setTimeout(() => setError(''), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fe' }}><div className="spinner"></div></div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', sans-serif" }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={user} onLogout={handleLogout} />
        
        <main style={{ padding: '100px 40px 40px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button 
                onClick={() => navigate('/students')} 
                className="premium-btn-secondary"
                style={{ width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icons.ArrowLeft />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Scholar Registry</span>
                  <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Scholastic Identity</span>
                </div>
                <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>
                  {student?.firstName} <span style={{ color: 'var(--brand-green)' }}>{student?.lastName}</span>
                </h1>
                <p style={{ fontSize: '16px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>Administering academic records and institutional standing for node {student?.admissionNumber || 'N/A'}.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {isEditing ? (
                <>
                  <button onClick={handleSaveEdit} disabled={saving} className="premium-btn-primary">
                    {saving ? <div className="mini-spinner"></div> : <Icons.Check />}
                    Commit Changes
                  </button>
                  <button onClick={() => setIsEditing(false)} className="premium-btn-secondary">
                    <Icons.X />
                    Abort
                  </button>
                </>
              ) : (
                <button onClick={startEdit} className="premium-btn-primary">
                  <Icons.Edit />
                  Update Identity
                </button>
              )}
            </div>
          </div>


          {success && <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #10b981', fontWeight: '500', animation: 'slideIn 0.3s ease-out' }}>{success}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px' }}>
            {/* Profile Sidebar */}
            <aside>
              <div className="glass-card" style={{ padding: '40px 32px', textAlign: 'center' }}>
                <div style={{ 
                  width: '140px', 
                  height: '140px', 
                  borderRadius: '40px', 
                  backgroundColor: 'var(--brand-yellow)', 
                  margin: '0 auto 28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '48px', 
                  fontWeight: '900', 
                  boxShadow: '0 20px 40px rgba(255, 184, 0, 0.2)',
                  border: '4px solid white'
                }}>
                  {student?.firstName?.[0]}{student?.lastName?.[0]}
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>{student?.firstName} {student?.lastName}</h2>
                <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', fontWeight: '600' }}>{displayGrade(student?.grade)} • Section {student?.section || 'A'}</p>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 20px', 
                  borderRadius: '20px', 
                  backgroundColor: student?.status === 'active' ? '#ecfdf5' : '#fef2f2', 
                  color: student?.status === 'active' ? '#065f46' : '#991b1b', 
                  fontSize: '11px', 
                  fontWeight: '900', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  border: `1px solid ${student?.status === 'active' ? '#d1fae5' : '#fee2e2'}`
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                  {student?.status || 'Active'}
                </div>

                <div style={{ marginTop: '40px', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '40px', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Identity Nodes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <InfoRow icon={<Icons.Calendar />} label="Temporal Birth" value={student?.dateOfBirth} />
                    <InfoRow icon={<Icons.MapPin />} label="Geographic Node" value={student?.address?.city} />
                    <InfoRow icon={<Icons.Heart />} label="Biometric Group" value={student?.medicalInfo?.bloodType || 'N/A'} />
                    <InfoRow icon={<Icons.Activity />} label="Attendance Synchrony" value="94%" />
                  </div>
                </div>
              </div>
            </aside>


            {/* Main Content Area */}
            <section>
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {!isEditing && (
                  <div style={{ display: 'flex', padding: '0 32px', backgroundColor: 'var(--brand-slate-50)', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    {['personal', 'medical', 'academic'].map(tab => (
                      <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        style={{ 
                          padding: '24px 32px', 
                          border: 'none', 
                          background: 'none', 
                          fontSize: '13px', 
                          fontWeight: '900', 
                          color: activeTab === tab ? 'var(--brand-green)' : '#94a3b8', 
                          borderBottom: activeTab === tab ? '3px solid var(--brand-green)' : '3px solid transparent', 
                          cursor: 'pointer', 
                          transition: 'all 0.2s', 
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}
                      >
                        {tab} Matrix
                      </button>
                    ))}
                  </div>
                )}


                <div style={{ padding: '40px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      <FormSection title="Student Identity" icon={<Icons.User />}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                          <FormGroup label="First Name" name="firstName" value={editFormData.firstName} onChange={handleEditChange} />
                          <FormGroup label="Last Name" name="lastName" value={editFormData.lastName} onChange={handleEditChange} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Gender</label>
                            <PremiumSelect 
                              value={editFormData.gender}
                              onChange={(e) => handleEditChange({ target: { name: 'gender', value: e.target.value } })}
                              options={[{value:'male', label:'Male'}, {value:'female', label:'Female'}]}
                              placeholder="Select Gender"
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Date of Birth</label>
                            <PremiumDatePicker 
                              value={editFormData.dateOfBirth}
                              onChange={(date) => handleEditChange({ target: { name: 'dateOfBirth', value: date } })}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Grade</label>
                            <PremiumSelect 
                              value={editFormData.grade}
                              onChange={(e) => handleEditChange({ target: { name: 'grade', value: e.target.value } })}
                              options={dbGrades.map(g => ({ value: g.name, label: displayGrade(g.name) }))}
                              placeholder="Select Grade"
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Section</label>
                            <PremiumSelect 
                              value={editFormData.section}
                              onChange={(e) => handleEditChange({ target: { name: 'section', value: e.target.value } })}
                              options={availableSections.map(s => ({ value: s.name, label: s.name }))}
                              placeholder="Select Section"
                            />
                          </div>
                        </div>
                      </FormSection>

                      <FormSection title="Residential & Contact" icon={<Icons.MapPin />}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                          <FormGroup label="Street" name="address.street" value={editFormData.address?.street} onChange={handleEditChange} />
                          <FormGroup label="City" name="address.city" value={editFormData.address?.city} onChange={handleEditChange} />
                          <FormGroup label="Emergency Contact" name="emergencyContact.name" value={editFormData.emergencyContact?.name} onChange={handleEditChange} />
                          <FormGroup label="Relation" name="emergencyContact.relationship" value={editFormData.emergencyContact?.relationship} onChange={handleEditChange} />
                          <FormGroup label="Emergency Phone" name="emergencyContact.phone" value={editFormData.emergencyContact?.phone} onChange={handleEditChange} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Account Status</label>
                            <PremiumSelect 
                              value={editFormData.status}
                              onChange={(e) => handleEditChange({ target: { name: 'status', value: e.target.value } })}
                              options={[{value:'active', label:'Active'}, {value:'inactive', label:'Inactive'}]}
                              placeholder="Select Status"
                            />
                          </div>
                        </div>
                      </FormSection>

                      <FormSection title="Medical Records" icon={<Icons.Heart />}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                          <FormGroup label="Blood Group" name="medicalInfo.bloodType" value={editFormData.medicalInfo?.bloodType} onChange={handleEditChange} />
                          <FormGroup label="Allergies" name="medicalInfo.allergies" value={editFormData.medicalInfo?.allergies} onChange={handleEditChange} />
                          <FormGroup label="Medical Conditions" name="medicalInfo.medicalConditions" value={editFormData.medicalInfo?.medicalConditions} onChange={handleEditChange} />
                        </div>
                      </FormSection>
                    </div>
                  ) : (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                      {activeTab === 'personal' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                          <DataBlock label="Gender Specification" value={student?.gender} />
                          <DataBlock label="Temporal Birth" value={student?.dateOfBirth} />
                          <DataBlock label="Residential Node" value={student?.address?.street} />
                          <DataBlock label="Geographic Region" value={`${student?.address?.city || ''}, ${student?.address?.region || ''}`} />
                          <DataBlock label="Legal Guardian" value={student?.parentName || student?.parentIds?.[0] || 'Unassigned'} fullWidth />
                          <DataBlock label="Emergency Protocol" value={`${student?.emergencyContact?.name || 'N/A'} (${student?.emergencyContact?.phone || 'N/A'})`} fullWidth />
                        </div>
                      )}
                      {activeTab === 'medical' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                          <DataBlock label="Biometric Group" value={student?.medicalInfo?.bloodType} />
                          <DataBlock label="Immunology Alerts" value={student?.medicalInfo?.allergies} />
                          <DataBlock label="Clinical History" value={student?.medicalInfo?.medicalConditions} fullWidth />
                        </div>
                      )}
                      {activeTab === 'academic' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                          <MetricCard title="Scholastic Level" value={displayGrade(student?.grade)} icon={<Icons.Award />} color="var(--brand-green)" />
                          <MetricCard title="Curriculum Nodes" value={curriculumCount} icon={<Icons.Book />} color="#6366f1" />
                          <MetricCard 
                            title="Performance Index" 
                            value={grades.length > 0 
                              ? `${(grades.reduce((acc, g) => acc + (parseFloat(g.total_score || g.totalScore || 0)), 0) / grades.length).toFixed(1)}%` 
                              : '0.0%'} 
                            icon={<Icons.Activity />} 
                            color="#f59e0b" 
                          />
                        </div>
                      )}
                    </div>

                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      
      {/* Premium Styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--brand-green); borderRadius: 50%; animation: spin 1s linear infinite; }
        .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; borderRadius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input:focus, select:focus { border-color: var(--brand-green) !important; box-shadow: 0 0 0 4px rgba(0, 132, 62, 0.1) !important; outline: none !important; }
      `}</style>
    </div>
  );
};

// Internal Helper Components
const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
    <div style={{ color: 'var(--brand-yellow)', backgroundColor: 'var(--brand-slate-50)', padding: '10px', borderRadius: '12px', border: '1px solid var(--brand-slate-100)' }}>{icon}</div>
    <div>
      <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#0f172a', margin: '2px 0 0', fontWeight: '700' }}>{value || 'N/A'}</p>
    </div>
  </div>
);


const FormSection = ({ title, icon, children }) => (
  <div style={{ backgroundColor: 'var(--brand-slate-50)', border: '1px solid var(--brand-slate-100)', borderRadius: '24px', padding: '32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', color: '#0f172a' }}>
      <div style={{ color: 'var(--brand-green)' }}>{icon}</div>
      <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>{title}</h4>
    </div>
    {children}
  </div>
);


const FormGroup = ({ label, name, value, onChange, type = 'text' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', transition: 'all 0.2s' }} />
  </div>
);

const DataBlock = ({ label, value, fullWidth = false }) => (
  <div style={{ gridColumn: fullWidth ? 'span 2' : 'auto' }}>
    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</p>
    <p style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', margin: 0 }}>{value || 'Institutional Null'}</p>
  </div>
);

const MetricCard = ({ title, value, icon, color }) => (
  <div style={{ padding: '28px', borderRadius: '24px', backgroundColor: 'var(--brand-slate-50)', border: `1px solid var(--brand-slate-100)` }}>
    <div style={{ color: color, marginBottom: '20px' }}>{icon}</div>
    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</p>
    <p style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0', letterSpacing: '-1px' }}>{value}</p>
  </div>
);


export default StudentProfile;