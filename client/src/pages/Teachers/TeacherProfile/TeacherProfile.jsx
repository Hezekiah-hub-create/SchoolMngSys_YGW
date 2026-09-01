import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teacherAPI, courseAPI, staffAPI, academicClassesAPI, academicSubjectsAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

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
  Award: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
};

const subjectOptions = [
  { value: 'English Language', label: 'English Language' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Integrated Science', label: 'Integrated Science' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'Computing (ICT)', label: 'Computing (ICT)' },
  { value: 'Religious & Moral Education', label: 'Religious & Moral Education' },
  { value: 'Ghanaian Language', label: 'Ghanaian Language' },
  { value: 'Creative Arts & Design', label: 'Creative Arts & Design' },
  { value: 'Career Technology', label: 'Career Technology' },
  { value: 'French', label: 'French' },
  { value: 'Our World Our People', label: 'Our World Our People' },
  { value: 'History', label: 'History' },
  { value: 'Physical Education', label: 'Physical Education' },
];

const gradeOptions = [
  { value: 'KG 1', label: 'KG 1' },
  { value: 'KG 2', label: 'KG 2' },
  { value: 'KG 3', label: 'KG 3' },
  { value: 'Basic 1', label: 'Basic 1' },
  { value: 'Basic 2', label: 'Basic 2' },
  { value: 'Basic 3', label: 'Basic 3' },
  { value: 'Basic 4', label: 'Basic 4' },
  { value: 'Basic 5', label: 'Basic 5' },
  { value: 'Basic 6', label: 'Basic 6' },
  { value: 'Basic 7', label: 'Basic 7' },
  { value: 'Basic 8', label: 'Basic 8' },
  { value: 'Basic 9', label: 'Basic 9' },
];

const coordinatorOptions = [
  { value: '', label: 'None (Regular Teacher)' },
  { value: 'KG', label: 'Kindergarten (KG 1-3)' },
  { value: 'Basic 1-3', label: 'Lower Basic (Basic 1-3)' },
  { value: 'Basic 4-6', label: 'Upper Basic (Basic 4-6)' },
  { value: 'JHS', label: 'Basic 7-9 (JHS)' },
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
    <label className="premium-label">{label}</label>
    {type === 'select' ? (
      <select name={name} value={value || ''} onChange={onChange} className="premium-input" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', backgroundColor: 'white', transition: 'all 0.2s' }}>
        <option value="">Select Option</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.v || opt.value || ''}>
            {opt.l || opt.label || ''}
          </option>
        ))}
      </select>
    ) : (
      <input type={type} name={name} value={value || ''} onChange={onChange} className="premium-input" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', transition: 'all 0.2s' }} />
    )}
  </div>
);

const AllocationSelector = ({ allocations, selectedIds, onChange }) => {
  const [activeClasses, setActiveClasses] = React.useState([]);

  // Group allocations by class name
  const grouped = allocations.reduce((acc, alloc) => {
    const className = alloc.grade || alloc.class?.name || 'Unmapped Class';
    if (!acc[className]) acc[className] = [];
    acc[className].push(alloc);
    return acc;
  }, {});

  // Sync activeClasses with selectedIds on mount or selection changes
  React.useEffect(() => {
    const classesOfSelected = selectedIds.map(id => {
      const alloc = allocations.find(a => a.id === id);
      return alloc ? (alloc.grade || alloc.class?.name) : null;
    }).filter(Boolean);
    
    if (classesOfSelected.length > 0) {
      setActiveClasses(prev => [...new Set([...prev, ...classesOfSelected])]);
    }
  }, [selectedIds, allocations]);

  const handleToggleAlloc = (id) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onChange(newSelected);
  };

  const handleToggleClass = (className) => {
    if (activeClasses.includes(className)) {
      setActiveClasses(activeClasses.filter(c => c !== className));
      const classAllocIds = (grouped[className] || []).map(a => a.id);
      const newSelected = selectedIds.filter(id => !classAllocIds.includes(id));
      onChange(newSelected);
    } else {
      setActiveClasses([...activeClasses, className]);
    }
  };

  if (allocations.length === 0) {
    return <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Loading active curriculum nodes...</div>;
  }

  const availableClasses = Object.keys(grouped).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Select Classes to Dispatch
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {availableClasses.map(className => {
            const isActive = activeClasses.includes(className);
            return (
              <button
                key={className}
                type="button"
                onClick={() => handleToggleClass(className)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--brand-green)' : '#e2e8f0',
                  backgroundColor: isActive ? 'var(--brand-green)' : 'white',
                  color: isActive ? 'white' : '#64748b',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 2px 4px rgba(0, 132, 62, 0.15)' : 'none'
                }}
              >
                {className}
              </button>
            );
          })}
        </div>
      </div>

      {activeClasses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Configure Class Subjects
          </label>
          {activeClasses.sort().map(className => (
            <div key={className} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{className}</h4>
                <button 
                  type="button" 
                  onClick={() => {
                    const classAllocIds = (grouped[className] || []).map(a => a.id);
                    const allSelected = classAllocIds.every(id => selectedIds.includes(id));
                    let newSelected;
                    if (allSelected) {
                      newSelected = selectedIds.filter(id => !classAllocIds.includes(id));
                    } else {
                      newSelected = [...new Set([...selectedIds, ...classAllocIds])];
                    }
                    onChange(newSelected);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {(grouped[className] || []).map(a => a.id).every(id => selectedIds.includes(id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {(grouped[className] || []).map(alloc => {
                  const isSelected = selectedIds.includes(alloc.id);
                  const currentTeacher = alloc.teacher ? `${alloc.teacher.first_name || alloc.teacher.firstName || '' } ${alloc.teacher.last_name || alloc.teacher.lastName || ''}`.trim() : null;
                  
                  return (
                    <div 
                      key={alloc.id}
                      onClick={() => handleToggleAlloc(alloc.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--brand-green)' : '#e2e8f0',
                        backgroundColor: isSelected ? 'rgba(0, 132, 62, 0.04)' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s',
                        userSelect: 'none'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} 
                        style={{ accentColor: 'var(--brand-green)', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{alloc.name || alloc.subject?.name || 'Unmapped Subject'}</span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--brand-green)' }}>Section {alloc.section}</span>
                        {currentTeacher && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Currently: {currentTeacher}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [allAllocations, setAllAllocations] = useState([]);
  const [selectedAllocations, setSelectedAllocations] = useState([]);

  useEffect(() => { 
    fetchTeacherData(); 
    fetchAcademicMetadata();
  }, [id]);

  const fetchAcademicMetadata = async () => {
    try {
      const [gradesRes, subjectsRes, allocsRes] = await Promise.all([
        academicClassesAPI.getAll(),
        academicSubjectsAPI.getAll(),
        courseAPI.getAll({ limit: 5000 })
      ]);
      if (gradesRes.data?.success) setDbGrades(gradesRes.data.data);
      if (subjectsRes.data?.success) setDbSubjects(subjectsRes.data.data);
      if (allocsRes.data?.success || allocsRes.data) {
        setAllAllocations(allocsRes.data?.data || allocsRes.data || []);
      }
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
          try {
            const staffRes = await staffAPI.getById(id);
            if (staffRes.data) {
              res = staffRes;
              setIsStaff(true);
            } else { throw err; }
          } catch (sErr) { throw err; }
        } else { throw err; }
      }

      if (res.data?.success || res.data) {
        const data = res.data.data || res.data;
        setTeacher(data);
        try {
          const coursesRes = await courseAPI.getByTeacher(id);
          const teacherAllocs = coursesRes.data?.data || coursesRes.data || [];
          setTeacherCourses(teacherAllocs);
          setSelectedAllocations(teacherAllocs.map(a => a.id));
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

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authUser'); navigate('/login'); } };

  const startEdit = () => {
    const rawAddress = teacher?.address || {};
    const rawEmergency = teacher?.emergencyContact || teacher?.emergency_contact || {};
    setFormData({
      firstName: teacher?.firstName || teacher?.first_name || '',
      otherNames: teacher?.otherNames || teacher?.other_names || '',
      lastName: teacher?.lastName || teacher?.last_name || '',
      gender: teacher?.gender || '',
      dateOfBirth: teacher?.dateOfBirth || teacher?.date_of_birth ? (teacher.dateOfBirth || teacher.date_of_birth).split('T')[0] : '',
      nationality: teacher?.nationality || 'Ghanaian',
      religion: teacher?.religion || '',
      email: teacher?.email || '',
      phone: teacher?.phone || '',
      address: {
        street: rawAddress.street || teacher?.street || '',
        city: rawAddress.city || teacher?.city || '',
        region: rawAddress.region || rawAddress.state || teacher?.state || '',
        country: rawAddress.country || 'Ghana'
      },
      emergencyContact: {
        name: rawEmergency.name || '',
        relationship: rawEmergency.relationship || '',
        phone: rawEmergency.phone || '',
        email: rawEmergency.email || ''
      },
      subject: teacher?.subject || '',
      subjects: teacher?.subjects || [],
      grades: teacher?.grades || [],
      qualifications: Array.isArray(teacher?.qualifications) ? teacher.qualifications[0] : (teacher?.qualifications || ''),
      specialization: teacher?.specialization || '',
      experience: teacher?.experience ?? 0,
      dateOfEmployment: teacher?.dateOfEmployment || teacher?.date_of_employment ? (teacher.dateOfEmployment || teacher.date_of_employment).split('T')[0] : '',
      contractType: teacher?.contractType || teacher?.contract_type || 'permanent',
      position: teacher?.position || 'Teacher',
      socialSecurity: teacher?.socialSecurity || teacher?.social_security || teacher?.ssnit || '',
      status: teacher?.status || 'active',
      coordinatorBlock: teacher?.coordinatorBlock || teacher?.coordinator_block || ''
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
        ...formData,
        selectedAllocations: selectedAllocations
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

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}><div className="premium-loader"></div></div>;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ maxWidth: '1600px', padding: '0 0 60px 0' }}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button 
                onClick={() => navigate('/teachers')} 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '16px', 
                  border: '1px solid var(--brand-slate-200)', 
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: 'var(--brand-slate-600)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--brand-slate-50)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <Icons.ArrowLeft />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty Portfolio</span>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-slate-300)' }}></div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--brand-slate-500)' }}>{teacher?.employeeId || 'Staff'}</span>
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--brand-slate-900)', margin: 0, letterSpacing: '-0.02em' }}>
                  {teacher?.firstName} <span style={{ color: 'var(--brand-green)' }}>{teacher?.lastName}</span>
                </h1>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="premium-btn-secondary" style={{ backgroundColor: 'white', border: '1px solid var(--brand-slate-200)', boxShadow: 'none' }}>
                    <Icons.X /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="premium-btn-primary">
                    {saving ? <div className="mini-spinner"></div> : <Icons.Check />} Save Profile
                  </button>
                </>
              ) : (
                <button onClick={startEdit} className="premium-btn-primary">
                  <Icons.Edit /> Edit Credentials
                </button>
              )}
            </div>
          </div>

          {success && (
            <div style={{ 
              backgroundColor: '#ecfdf5', 
              color: '#065f46', 
              padding: '16px 24px', 
              borderRadius: '16px', 
              marginBottom: '32px', 
              border: '1px solid #d1fae5', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontWeight: '600',
              animation: 'slideDown 0.4s cubic-bezier(0, 0, 0.2, 1)'
            }}>
              <Icons.Check /> {success}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '32px', alignItems: 'start' }}>
            {/* Sidebar Card */}
            <div className="glass-card" style={{ padding: '40px 32px', position: 'sticky', top: '110px' }}>
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 24px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '48px', 
                  backgroundColor: 'var(--brand-green)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '48px', 
                  fontWeight: '800', 
                  color: 'white',
                  border: '4px solid white',
                  boxShadow: '0 10px 25px rgba(0, 132, 62, 0.2)'
                }}>
                  {teacher?.firstName?.[0]}{teacher?.lastName?.[0]}
                </div>
                <div style={{ 
                  position: 'absolute', 
                  bottom: '5px', 
                  right: '5px', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '10px', 
                  backgroundColor: teacher?.status === 'active' ? '#10b981' : '#ef4444',
                  border: '3px solid white',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}></div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand-slate-900)', margin: '0 0 8px 0' }}>{teacher?.firstName} {teacher?.lastName}</h2>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--brand-slate-500)', margin: 0 }}>{teacher?.position || 'Teacher'}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '32px' }}>
                <QuickInfo icon={<Icons.Mail />} label="Email Address" value={teacher?.email} />
                <QuickInfo icon={<Icons.Phone />} label="Phone Number" value={teacher?.phone} />
                <QuickInfo icon={<Icons.Briefcase />} label="Employee ID" value={teacher?.employeeId} />
                <QuickInfo icon={<Icons.MapPin />} label="Location" value={teacher?.address?.city} />
              </div>
            </div>

            {/* Main Content Card */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: '600px' }}>
              <div style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid var(--brand-slate-100)', backgroundColor: '#fcfdfe' }}>
                {[
                  { id: 'personal', label: 'Personal Information', icon: <Icons.User /> },
                  { id: 'professional', label: 'Professional Career', icon: <Icons.Briefcase /> },
                  { id: 'academic', label: 'Academic Assignments', icon: <Icons.Book /> }
                ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    style={{ 
                      padding: '24px 24px', 
                      border: 'none', 
                      background: 'none', 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: activeTab === tab.id ? 'var(--brand-green)' : 'var(--brand-slate-400)', 
                      borderBottom: activeTab === tab.id ? '3px solid var(--brand-green)' : '3px solid transparent', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ opacity: activeTab === tab.id ? 1 : 0.6 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '40px' }}>
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    <div className="responsive-grid-3">
                      <div style={{ gridColumn: 'span 3' }}><SectionTitle title="Identity & Personal" /></div>
                      <FormGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                      <FormGroup label="Other Names" name="otherNames" value={formData.otherNames} onChange={handleChange} placeholder="Middle / Other Names" />
                      <FormGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="premium-label">Gender</label>
                        <select name="gender" value={formData.gender || ''} onChange={handleChange} className="premium-input">
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <FormGroup label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} type="date" />
                      <FormGroup label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                      <FormGroup label="SSNIT Number" name="socialSecurity" value={formData.socialSecurity} onChange={handleChange} />
                    </div>

                    <div className="responsive-grid-3">
                      <div style={{ gridColumn: 'span 3' }}><SectionTitle title="Contact & Residence" /></div>
                      <FormGroup label="Email" name="email" value={formData.email} onChange={handleChange} />
                      <FormGroup label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                      <FormGroup label="Street" name="address.street" value={formData.address?.street} onChange={handleChange} />
                      <FormGroup label="City" name="address.city" value={formData.address?.city} onChange={handleChange} />
                      <FormGroup label="Emergency Contact" name="emergencyContact.name" value={formData.emergencyContact?.name} onChange={handleChange} />
                      <FormGroup label="Emergency Phone" name="emergencyContact.phone" value={formData.emergencyContact?.phone} onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      <SectionTitle title="Professional Details" />
                      <div className="responsive-grid-3">
                        <FormGroup label="Qualification" name="qualifications" value={formData.qualifications} onChange={handleChange} />
                        <FormGroup label="Coordinator Block" name="coordinatorBlock" value={formData.coordinatorBlock} onChange={handleChange} type="select" options={coordinatorOptions} />
                        <FormGroup label="Position" name="position" value={formData.position} onChange={handleChange} />
                        <FormGroup label="Experience (Years)" name="experience" value={formData.experience} onChange={handleChange} type="number" />
                        <FormGroup label="Employment Date" name="dateOfEmployment" value={formData.dateOfEmployment} onChange={handleChange} type="date" />
                      </div>
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                        <AllocationSelector 
                          allocations={allAllocations} 
                          selectedIds={selectedAllocations} 
                          onChange={setSelectedAllocations} 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {activeTab === 'personal' && (
                      <div className="responsive-grid-2" style={{ gap: '48px' }}>
                        <DetailBlock label="Gender" value={teacher?.gender} icon={<Icons.User />} />
                        <DetailBlock label="Date of Birth" value={teacher?.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString() : 'N/A'} icon={<Icons.Calendar />} />
                        <DetailBlock label="Nationality" value={teacher?.nationality} icon={<Icons.Shield />} />
                        <DetailBlock label="SSNIT ID" value={teacher?.socialSecurity} icon={<Icons.Shield />} />
                        <DetailBlock label="Residential Address" value={`${teacher?.address?.street}, ${teacher?.address?.city}`} icon={<Icons.MapPin />} fullWidth />
                        <DetailBlock label="Emergency Contact" value={`${teacher?.emergencyContact?.name} (${teacher?.emergencyContact?.phone})`} icon={<Icons.Phone />} fullWidth />
                      </div>
                    )}
                    {activeTab === 'professional' && (
                      <div className="responsive-grid-2" style={{ gap: '48px' }}>
                        <DetailBlock label="Employment Date" value={teacher?.dateOfEmployment ? new Date(teacher.dateOfEmployment).toLocaleDateString() : 'N/A'} icon={<Icons.Calendar />} />
                        <DetailBlock label="Contract Type" value={teacher?.contractType} icon={<Icons.Briefcase />} />
                        <DetailBlock label="Highest Qualification" value={teacher?.qualifications} icon={<Icons.Award />} />
                        <DetailBlock label="Coordinator Block" value={teacher?.coordinatorBlock || 'None'} icon={<Icons.Shield />} />
                        <DetailBlock label="Specialization" value={teacher?.specialization} icon={<Icons.Book />} />
                        <DetailBlock label="Professional Experience" value={`${teacher?.experience || 0} Years`} icon={<Icons.Award />} />
                      </div>
                    )}
                    {activeTab === 'academic' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                        <div>
                          <SectionTitle title="Assigned Curriculum Nodes" />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {(teacherCourses.length > 0 ? [...new Set(teacherCourses.map(c => c.name || c.subject))] : (teacher?.subjects?.length > 0 ? teacher.subjects : (teacher?.subject ? [teacher.subject] : []))).map((s, i) => (
                              <Badge key={i} text={s} color="var(--brand-green)" />
                            ))}
                            {teacherCourses.length === 0 && (!teacher?.subjects || teacher.subjects.length === 0) && !teacher?.subject && <p style={{ color: 'var(--brand-slate-400)', fontSize: '14px' }}>No subjects assigned</p>}
                          </div>
                        </div>
                        <div>
                          <SectionTitle title="Teaching Grade Matrix" />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {(teacherCourses.length > 0 ? [...new Set(teacherCourses.map(c => `${c.grade}`))] : (teacher?.grades || [])).map((g, i) => (
                              <Badge key={i} text={g} color="#6366f1" />
                            ))}
                            {teacherCourses.length === 0 && (!teacher?.grades || teacher.grades.length === 0) && <p style={{ color: 'var(--brand-slate-400)', fontSize: '14px' }}>No grades assigned</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .mini-spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// Helper Components
const QuickInfo = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      borderRadius: '12px', 
      backgroundColor: 'var(--brand-slate-50)', 
      color: 'var(--brand-green)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '1px solid var(--brand-slate-100)'
    }}>{icon}</div>
    <div>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--brand-slate-400)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: '14px', color: 'var(--brand-slate-900)', fontWeight: '700' }}>{value || 'N/A'}</p>
    </div>
  </div>
);

const DetailBlock = ({ label, value, icon, fullWidth = false }) => (
  <div style={{ gridColumn: fullWidth ? 'span 2' : 'auto' }}>
    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--brand-slate-400)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <span style={{ color: 'var(--brand-green)', marginTop: '2px', opacity: 0.6 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: '16px', color: 'var(--brand-slate-900)', fontWeight: '600', lineHeight: 1.5 }}>{value || 'Not provided'}</p>
    </div>
  </div>
);

const SectionTitle = ({ title }) => (
  <h3 style={{ 
    fontSize: '14px', 
    fontWeight: '800', 
    color: 'var(--brand-slate-900)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em', 
    margin: '0 0 24px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }}>
    {title}
    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--brand-slate-100)' }}></div>
  </h3>
);


const Badge = ({ text, color }) => (
  <div style={{ 
    padding: '10px 20px', 
    backgroundColor: 'white', 
    color: color, 
    borderRadius: '14px', 
    fontSize: '14px', 
    fontWeight: '700', 
    border: '1px solid var(--brand-slate-100)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
  }}>
    {text}
  </div>
);

export default TeacherProfile;
