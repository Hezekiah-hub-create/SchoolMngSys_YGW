import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherAPI, academicSubjectsAPI, courseAPI, academicClassesAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import PremiumDatePicker from '../../../components/common/PremiumDatePicker';
import PremiumSelect from '../../../components/common/PremiumSelect';


const FormInput = ({ label, name, type = 'text', value, onChange, required = false, placeholder = '', options = [] }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {type === 'date' ? (
      <PremiumDatePicker
        value={value}
        onChange={(val) => onChange({ target: { name, value: val } })}
        placeholder={placeholder || `Select ${label}`}
      />
    ) : options.length > 0 ? (
      <PremiumSelect
        label={name}
        value={value}
        options={options}
        onChange={onChange}
        placeholder={`Select ${label}`}
      />
    ) : (
      <input 
        type={type} 
        name={name} 
        value={value} 
        onChange={onChange} 
        required={required} 
        placeholder={placeholder} 
        className="premium-input"
      />
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
          const optValue = opt.value || '';
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
                backgroundColor: isSelected ? 'rgba(0, 132, 62, 0.08)' : 'white',
                color: isSelected ? 'var(--brand-green)' : '#64748b',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {opt.label || ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SectionHeader = ({ title, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{title}</h3>
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

const AddTeacher = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeMenu, setActiveMenu] = useState('Staff');

  const [formData, setFormData] = useState({
    firstName: '', otherNames: '', lastName: '', gender: '', dateOfBirth: '', nationality: '', religion: '',
    email: '', phone: '', street: '', city: '', state: '',
    employeeId: '', subject: '', position: '', qualifications: '', specialization: '',
    experience: '', dateOfEmployment: '', subjects: [], grades: [], coordinatorBlock: ''
  });
  const [dbSubjects, setDbSubjects] = useState([]);
  const [dbGrades, setDbGrades] = useState([]);
  const [allAllocations, setAllAllocations] = useState([]);
  const [selectedAllocations, setSelectedAllocations] = useState([]);

  React.useEffect(() => {
    academicSubjectsAPI.getAll().then(res => {
      if (res.data?.success) setDbSubjects(res.data.data);
    }).catch(() => {});
    academicClassesAPI.getAll().then(res => {
      if (res.data?.success) setDbGrades(res.data.data);
    }).catch(() => {});
    courseAPI.getAll({ limit: 5000 }).then(res => {
      const data = res.data?.data || res.data || [];
      setAllAllocations(data);
    }).catch(() => {});
  }, []);

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
    { value: 'Physical Education', label: 'Physical Education' }
  ];

  const qualificationOptions = [
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Bachelor Degree', label: 'Bachelor Degree' },
    { value: 'Master Degree', label: 'Master Degree' },
    { value: 'PhD', label: 'PhD' },
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
    { value: 'Basic 9', label: 'Basic 9' }
  ];

  const coordinatorOptions = [
    { value: '', label: 'None (Regular Teacher)' },
    { value: 'KG', label: 'Kindergarten (KG 1-3)' },
    { value: 'Basic 1-3', label: 'Lower Basic (Basic 1-3)' },
    { value: 'Basic 4-6', label: 'Upper Basic (Basic 4-6)' },
    { value: 'JHS', label: 'Basic 7-9 (JHS)' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const teacherData = {
        ...formData,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: 'Ghana'
        },
        subjects: formData.subjects.length > 0 ? formData.subjects : (formData.subject ? [formData.subject] : []),
        grades: formData.grades || [],
        selectedAllocations: selectedAllocations
      };
      
      const response = await teacherAPI.create(teacherData);
      if (response.data.success) {
        setSuccess('Teacher added successfully!');
        setTimeout(() => navigate('/teachers'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add teacher.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authUser'); navigate('/login'); } };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Add New Teacher</h1>
        <button onClick={() => navigate('/teachers')} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>Back to List</button>
      </div>

      {success && <div style={{ padding: '16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>{success}</div>}
      {error && <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <SectionHeader title="Personal Information" />
          <div className="form-grid-3">
            <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
            <FormInput label="Other Names" name="otherNames" value={formData.otherNames} onChange={handleChange} placeholder="Middle / Other Names" />
            <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            <FormInput label="Gender" name="gender" value={formData.gender} onChange={handleChange} required options={[{value:'male',label:'Male'},{value:'female',label:'Female'}]} />
            <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="e.g. teacher@uhasbasic.edu.gh" />
            <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
            <FormInput label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleChange} required placeholder="e.g. TCH011" />
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <SectionHeader title="Professional Information" />
          <div className="form-grid-3" style={{ marginBottom: '20px' }}>
            <FormInput label="Subject Specialty" name="subject" value={formData.subject} onChange={handleChange} required options={dbSubjects.length > 0 ? dbSubjects.map(s => ({ value: s.name, label: s.name })) : subjectOptions} />
            <FormInput label="Qualification" name="qualifications" value={formData.qualifications} onChange={handleChange} required options={qualificationOptions} />
            <FormInput label="Coordinator Block" name="coordinatorBlock" value={formData.coordinatorBlock} onChange={handleChange} options={coordinatorOptions} />
            <FormInput label="Join Date" name="dateOfEmployment" type="date" value={formData.dateOfEmployment} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <MultiSelect 
              label="Assigned Subjects (Syllabus Classes)" 
              name="subjects" 
              value={formData.subjects || []} 
              onChange={(val) => setFormData(p => ({ ...p, subjects: val }))} 
              options={dbSubjects.length > 0 ? dbSubjects.map(s => ({ value: s.name, label: s.name })) : subjectOptions} 
            />
            <MultiSelect 
              label="Assigned Grades/Classes" 
              name="grades" 
              value={formData.grades || []} 
              onChange={(val) => setFormData(p => ({ ...p, grades: val }))} 
              options={dbGrades.length > 0 ? dbGrades.map(g => ({ value: g.name, label: g.name })) : gradeOptions} 
            />
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <SectionHeader title="Curriculum Assignments Dispatch" />
          <AllocationSelector 
            allocations={allAllocations} 
            selectedIds={selectedAllocations} 
            onChange={setSelectedAllocations} 
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/teachers')} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '12px 24px', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Add Teacher'}
          </button>
        </div>
      </form>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AddTeacher;
