import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teacherAPI, courseAPI, staffAPI, academicClassesAPI, academicSubjectsAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import TopNav from '../../../components/layout/TopNav';

// Modern Icon Components
const displayGrade = (g) => {
  if (!g) return 'No Grade';
  let str = g.toString().trim();
  // Transform Primary 1-6 to Basic 1-6 for UI display
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

const Icons = {
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Briefcase: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Book: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const subjectOptions = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'English', label: 'English' },
  { value: 'Science', label: 'Science' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'ICT', label: 'ICT' },
  { value: 'Religious Studies', label: 'Religious Studies' },
  { value: 'French', label: 'French' },
  { value: 'Creative Arts', label: 'Creative Arts' },
  { value: 'Physical Education', label: 'Physical Education' },
  { value: 'Home Economics', label: 'Home Economics' },
];

const gradeOptions = [
  { value: 'KG 1', label: 'KG 1' },
  { value: 'KG 2', label: 'KG 2' },
  { value: 'KG 3', label: 'KG 3' },
  { value: 'Primary 1', label: 'Basic 1' },
  { value: 'Primary 2', label: 'Basic 2' },
  { value: 'Primary 3', label: 'Basic 3' },
  { value: 'Primary 4', label: 'Basic 4' },
  { value: 'Primary 5', label: 'Basic 5' },
  { value: 'Primary 6', label: 'Basic 6' },
  { value: 'Basic 7', label: 'Basic 7' },
  { value: 'Basic 8', label: 'Basic 8' },
  { value: 'Basic 9', label: 'Basic 9' },
  { value: 'JHS 1', label: 'JHS 1' },
  { value: 'JHS 2', label: 'JHS 2' },
  { value: 'JHS 3', label: 'JHS 3' },
];

const qualificationOptions = [
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Bachelor Degree', label: 'Bachelor Degree' },
  { value: 'Master Degree', label: 'Master Degree' },
  { value: 'PhD', label: 'PhD' },
];

const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
    <div style={{ color: 'var(--brand-green)', backgroundColor: 'var(--brand-slate-50)', padding: '10px', borderRadius: '12px', border: '1px solid var(--brand-slate-100)' }}>{icon}</div>
    <div>
      <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#0f172a', margin: '2px 0 0', fontWeight: '700' }}>{value || 'N/A'}</p>
    </div>
  </div>
);


// Helper Components
const FormSection = ({ title, icon, children }) => (
  <div style={{ backgroundColor: 'var(--brand-slate-50)', border: '1px solid var(--brand-slate-100)', borderRadius: '24px', padding: '32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', color: '#0f172a' }}>
      <div style={{ color: 'var(--brand-green)' }}>{icon}</div>
      <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>{title}</h4>
    </div>
    {children}
  </div>
);


const FormGroup = ({ label, name, value, onChange, type = 'text', options = [] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{label}</label>
    {type === 'select' ? (
      <select name={name} value={value || ''} onChange={onChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', backgroundColor: 'white', transition: 'all 0.2s' }}>
        <option value="">Select Option</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.v || opt.value || ''}>
            {opt.l || opt.label || ''}
          </option>
        ))}
      </select>
    ) : (
      <input type={type} name={name} value={value || ''} onChange={onChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', transition: 'all 0.2s' }} />
    )}
  </div>
);

const MultiSelect = ({ label, name, value = [], onChange, options = [] }) => {
  const handleToggle = (optValue) => {
    const newValue = value.includes(optValue)
      ? value.filter(v => v !== optValue)
      : [...value, optValue];
    onChange(newValue);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map((opt, idx) => {
          const optValue = opt.v || opt.value || '';
          const isSelected = value.includes(optValue);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleToggle(optValue)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isSelected ? 'var(--brand-green)' : '#e2e8f0',
                backgroundColor: isSelected ? 'var(--brand-green-light)' : 'white',
                color: isSelected ? 'var(--brand-green)' : '#64748b',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {opt.l || opt.label || ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const DataBlock = ({ label, value, fullWidth = false, badge = false }) => (
  <div style={{ gridColumn: fullWidth ? 'span 2' : 'auto' }}>
    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</p>
    {badge ? (
      <span style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '12px', backgroundColor: 'var(--brand-slate-50)', color: 'var(--brand-green)', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', border: '1px solid var(--brand-slate-100)' }}>{value || 'N/A'}</span>
    ) : (
      <p style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', margin: 0 }}>{value || 'Institutional Null'}</p>
    )}
  </div>
);


const TeacherProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Staff');
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [dbGrades, setDbGrades] = useState([]);
  const [dbSubjects, setDbSubjects] = useState([]);

  useEffect(() => { 
    fetchTeacherData(); 
    fetchAcademicMetadata();
  }, [id]);

  const fetchAcademicMetadata = async () => {
    try {
      const [gradesRes, subjectsRes] = await Promise.all([
        academicClassesAPI.getAll(),
        academicSubjectsAPI.getAll()
      ]);
      if (gradesRes.data?.success) setDbGrades(gradesRes.data.data);
      if (subjectsRes.data?.success) setDbSubjects(subjectsRes.data.data);
    } catch (err) {
      console.warn('Failed to fetch academic metadata', err);
    }
  };

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setIsStaff(false);
      let res;
      try {
        res = await teacherAPI.getById(id);
      } catch (err) {
        if (err.response?.status === 404) {
          // Fallback: check if this is a staff member
          try {
            const staffRes = await staffAPI.getById(id);
            if (staffRes.data) {
              res = staffRes;
              setIsStaff(true);
            } else {
              throw err;
            }
          } catch (sErr) {
            throw err;
          }
        } else {
          throw err;
        }
      }

      if (res.data?.success || res.data) {
        const data = res.data.data || res.data;
        setTeacher(data);

        // Fetch actual course assignments for academic matrix
        try {
          const coursesRes = await courseAPI.getByTeacher(id);
          if (coursesRes.data?.success) {
            setTeacherCourses(coursesRes.data.data);
          }
        } catch (e) {
          console.warn('Failed to fetch teacher courses', e);
        }
      }
    } catch (err) { 
      console.error('Fetch error:', err);
      setError('Failed to load profile');
    }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); } };

  const startEdit = () => {
    setFormData({
      firstName: teacher?.firstName || '',
      lastName: teacher?.lastName || '',
      gender: teacher?.gender || '',
      dateOfBirth: teacher?.dateOfBirth || '',
      nationality: teacher?.nationality || 'Ghanaian',
      email: teacher?.email || '',
      phone: teacher?.phone || '',
      address: teacher?.address || { street: '', city: '', region: '', country: 'Ghana' },
      emergencyContact: teacher?.emergencyContact || { name: '', relationship: '', phone: '', email: '' },
      subject: teacher?.subject || '',
      subjects: teacher?.subjects || [],
      grades: teacher?.grades || [],
      qualifications: Array.isArray(teacher?.qualifications) ? teacher.qualifications[0] : (teacher?.qualifications || ''),
      specialization: teacher?.specialization || '',
      experience: teacher?.experience || 0,
      salary: teacher?.salary || '',
      dateOfEmployment: teacher?.dateOfEmployment || '',
      contractType: teacher?.contractType || 'permanent',
      position: teacher?.position || 'Teacher',
      socialSecurity: teacher?.socialSecurity || '',
      status: teacher?.status || 'active'
    });
    setEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const teacherData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        subject: formData.subject,
        subjects: formData.subjects || [],
        grades: formData.grades || [],
        qualifications: formData.qualifications,
        salary: formData.salary,
        dateOfEmployment: formData.dateOfEmployment,
        contractType: formData.contractType,
        socialSecurity: formData.socialSecurity,
        status: formData.status,
        bankAccount: formData.bankAccount,
        position: formData.position,
        specialization: formData.specialization,
        experience: formData.experience,
        bio: formData.bio
      };
      
      if (isStaff) {
        await staffAPI.update(id, formData);
      } else {
        await teacherAPI.update(id, teacherData);
      }
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setEditing(false);
      fetchTeacherData();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      setTimeout(() => setError(''), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;

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
                onClick={() => navigate('/teachers')} 
                className="premium-btn-secondary"
                style={{ width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icons.ArrowLeft />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Faculty Node</span>
                  <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Faculty Ledger</span>
                </div>
                <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>
                  {teacher?.firstName} <span style={{ color: 'var(--brand-green)' }}>{teacher?.lastName}</span>
                </h1>
                <p style={{ fontSize: '16px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>Institutional profile and professional standing for node {teacher?.employeeId || 'N/A'}.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="premium-btn-primary">
                    {saving ? <div className="mini-spinner"></div> : <Icons.Check />}
                    Commit Profile
                  </button>
                  <button onClick={() => setEditing(false)} className="premium-btn-secondary">
                    <Icons.X />
                    Abort
                  </button>
                </>
              ) : (
                <button onClick={startEdit} className="premium-btn-primary">
                  <Icons.Edit />
                  Update Credentials
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
                  backgroundColor: 'var(--brand-green)', 
                  margin: '0 auto 28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '48px', 
                  fontWeight: '900', 
                  boxShadow: '0 20px 40px rgba(0, 132, 62, 0.2)',
                  border: '4px solid white'
                }}>
                  {teacher?.firstName?.[0]}{teacher?.lastName?.[0]}
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>{teacher?.firstName} {teacher?.lastName}</h2>
                <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', fontWeight: '600' }}>{teacher?.position || 'Teacher'}</p>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 20px', 
                  borderRadius: '20px', 
                  backgroundColor: teacher?.status === 'active' ? '#ecfdf5' : '#fef2f2', 
                  color: teacher?.status === 'active' ? '#065f46' : '#991b1b', 
                  fontSize: '11px', 
                  fontWeight: '900', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  border: `1px solid ${teacher?.status === 'active' ? '#d1fae5' : '#fee2e2'}`
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                  {teacher?.status || 'Active'}
                </div>

                <div style={{ marginTop: '40px', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '40px', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Communication Nodes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <InfoRow icon={<Icons.Mail />} label="Electronic Mail" value={teacher?.email} />
                    <InfoRow icon={<Icons.Phone />} label="Institutional Line" value={teacher?.phone} />
                    <InfoRow icon={<Icons.Briefcase />} label="Employee ID" value={teacher?.employeeId} />
                    <InfoRow icon={<Icons.MapPin />} label="Geographic Node" value={teacher?.address?.city} />
                  </div>
                </div>
              </div>
            </aside>


            {/* Main Content Area */}
            <section>
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {!editing && (
                  <div style={{ display: 'flex', padding: '0 32px', backgroundColor: 'var(--brand-slate-50)', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    {['personal', 'professional', 'academic'].map(tab => (
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
                  {editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      <FormSection title="Identity & Personal" icon={<Icons.User />}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                          <FormGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                          <FormGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                          <FormGroup label="Gender" name="gender" value={formData.gender} onChange={handleChange} type="select" options={[{v:'male', l:'Male'}, {v:'female', l:'Female'}]} />
                          <FormGroup label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} type="date" />
                          <FormGroup label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                          <FormGroup label="SSNIT Number" name="socialSecurity" value={formData.socialSecurity} onChange={handleChange} />
                        </div>
                      </FormSection>

                      <FormSection title="Contact & Residence" icon={<Icons.MapPin />}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                          <FormGroup label="Personal Email" name="email" value={formData.email} onChange={handleChange} />
                          <FormGroup label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
                          <FormGroup label="Street Address" name="address.street" value={formData.address?.street} onChange={handleChange} />
                          <FormGroup label="City" name="address.city" value={formData.address?.city} onChange={handleChange} />
                          <FormGroup label="Emergency Contact" name="emergencyContact.name" value={formData.emergencyContact?.name} onChange={handleChange} />
                          <FormGroup label="Emergency Phone" name="emergencyContact.phone" value={formData.emergencyContact?.phone} onChange={handleChange} />
                        </div>
                      </FormSection>

                      <FormSection title="Professional Career" icon={<Icons.Briefcase />}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                          <FormGroup 
                            label="Primary Subject" 
                            name="subject" 
                            value={formData.subject} 
                            onChange={handleChange} 
                            type="select" 
                            options={dbSubjects.length > 0 ? dbSubjects.map(s => ({v:s.name, l:s.name})) : subjectOptions.map(s => ({v:s.value, l:s.label}))} 
                          />
                          <MultiSelect 
                            label="All Subjects" 
                            name="subjects" 
                            value={formData.subjects || []} 
                            onChange={(val) => setFormData(prev => ({ ...prev, subjects: val }))} 
                            options={dbSubjects.length > 0 ? dbSubjects.map(s => ({value:s.name, label:s.name})) : subjectOptions} 
                          />
                          <MultiSelect 
                            label="Teaching Grades" 
                            name="grades" 
                            value={formData.grades || []} 
                            onChange={(val) => setFormData(prev => ({ ...prev, grades: val }))} 
                            options={dbGrades.length > 0 ? dbGrades.map(g => ({value:g.name, label:g.name})) : gradeOptions} 
                          />
                          <FormGroup label="Contract" name="contractType" value={formData.contractType} onChange={handleChange} type="select" options={[{v:'permanent', l:'Permanent'}, {v:'contract', l:'Contract'}]} />
                          <FormGroup label="Highest Qualification" name="qualifications" value={formData.qualifications} onChange={handleChange} type="select" options={qualificationOptions.map(q => ({v:q.value, l:q.label}))} />
                          <FormGroup label="Monthly Salary (GHS)" name="salary" value={formData.salary} onChange={handleChange} type="number" />
                          <FormGroup label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} />
                          <FormGroup label="Years of Experience" name="experience" value={formData.experience} onChange={handleChange} type="number" />
                          <FormGroup label="Position/Role" name="position" value={formData.position} onChange={handleChange} />
                          <FormGroup label="Employment Date" name="dateOfEmployment" value={formData.dateOfEmployment} onChange={handleChange} type="date" />
                          <FormGroup label="Employment Status" name="status" value={formData.status} onChange={handleChange} type="select" options={[{v:'active', l:'Active'}, {v:'inactive', l:'Inactive'}]} />
                        </div>
                      </FormSection>
                    </div>
                  ) : (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                      {activeTab === 'personal' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                          <DataBlock label="Gender Specification" value={teacher?.gender} />
                          <DataBlock label="Temporal Birth" value={teacher?.dateOfBirth} />
                          <DataBlock label="National Identity" value={teacher?.nationality} />
                          <DataBlock label="SSNIT Identifier" value={teacher?.socialSecurity} />
                          <DataBlock label="Residential Node" value={`${teacher?.address?.street}, ${teacher?.address?.city}`} fullWidth />
                          <DataBlock label="Emergency Protocol" value={`${teacher?.emergencyContact?.name} (${teacher?.emergencyContact?.phone})`} fullWidth />
                        </div>
                      )}
                      {activeTab === 'professional' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                          <DataBlock label="Commission Date" value={teacher?.dateOfEmployment} />
                          <DataBlock label="Contract Status" value={teacher?.contractType} badge />
                          <DataBlock label="Highest Qualification" value={teacher?.qualifications} />
                          <DataBlock label="Professional Specialization" value={teacher?.specialization} />
                          <DataBlock label="Institutional Remuneration" value={teacher?.salary ? `GHS ${teacher.salary.toLocaleString()}` : 'N/A'} />
                          <DataBlock label="Faculty Experience" value={`${teacher?.experience || 0} Years`} />
                        </div>
                      )}
                      {activeTab === 'academic' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          <div>
                            <p style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Allocated Curriculum Nodes</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                              {teacherCourses.length > 0 ? (
                                [...new Set(teacherCourses.map(c => c.name || c.subject))].map((s, i) => (
                                  <div key={i} style={{ padding: '12px 24px', backgroundColor: 'var(--brand-slate-50)', color: 'var(--brand-green)', borderRadius: '14px', fontSize: '14px', fontWeight: '700', border: '1px solid var(--brand-slate-100)' }}>{s}</div>
                                ))
                              ) : (
                                (teacher?.subjects || []).map((s, i) => (
                                  <div key={i} style={{ padding: '12px 24px', backgroundColor: 'var(--brand-slate-50)', color: 'var(--brand-green)', borderRadius: '14px', fontSize: '14px', fontWeight: '700', border: '1px solid var(--brand-slate-100)' }}>{s}</div>
                                ))
                              )}
                            </div>
                          </div>
                          <div>
                            <p style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Teaching Grade Matrix</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                              {teacherCourses.length > 0 ? (
                                [...new Set(teacherCourses.map(c => `${c.grade} ${c.section || 'A'}`))].map((g, i) => (
                                  <div key={i} style={{ padding: '12px 24px', backgroundColor: 'var(--brand-slate-50)', color: '#6366f1', borderRadius: '14px', fontSize: '14px', fontWeight: '700', border: '1px solid var(--brand-slate-100)' }}>{g}</div>
                                ))
                              ) : (
                                (teacher?.grades || []).map((g, i) => (
                                  <div key={i} style={{ padding: '12px 24px', backgroundColor: 'var(--brand-slate-50)', color: '#6366f1', borderRadius: '14px', fontSize: '14px', fontWeight: '700', border: '1px solid var(--brand-slate-100)' }}>{g}</div>
                                ))
                              )}
                            </div>
                          </div>
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
      
      {/* Styles & Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--brand-green); borderRadius: 50%; animation: spin 1s linear infinite; }
        .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; borderRadius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input:focus, select:focus { border-color: var(--brand-green) !important; box-shadow: 0 0 0 4px rgba(0, 132, 62, 0.1) !important; outline: none !important; }
        .user-profile-trigger:hover { background-color: #f8fafc; }
      `}</style>
    </div>
  );
};

export default TeacherProfile;
