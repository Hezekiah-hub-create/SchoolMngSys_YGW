import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import PremiumDatePicker from '../../../components/common/PremiumDatePicker';
import PremiumSelect from '../../../components/common/PremiumSelect';

const TopNav = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  return (
    <div style={{ height: '70px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', position: 'fixed', top: 0, left: '260px', right: 0, zIndex: 99 }}>
      <div style={{ flex: 1, maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '10px 16px', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
          <input type="text" placeholder="Search..." style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '14px', width: '100%', color: '#1e293b' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowDropdown(!showDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>{user?.firstName?.[0] || 'A'}</div>
            <div><p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{user?.firstName ? `${user.firstName} ${user.lastName}` : 'Admin'}</p><p style={{ fontSize: '12px', color: '#64748b' }}>Administrator</p></div>
          </div>
          {showDropdown && (<div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '200px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 1000 }}>
            <div style={{ padding: '8px' }}><button onClick={() => { if (onLogout) onLogout(); }} style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>Sign Out</button></div>
          </div>)}
        </div>
      </div>
    </div>
  );
};

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

const SectionHeader = ({ title, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{title}</h3>
  </div>
);

const AddTeacher = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeMenu, setActiveMenu] = useState('Staff');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', gender: '', dateOfBirth: '', nationality: '', religion: '',
    email: '', phone: '', street: '', city: '', state: '',
    employeeId: '', subject: '', position: '', qualifications: '', specialization: '',
    experience: '', dateOfEmployment: '', salary: '', subjects: []
  });

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
    { value: 'Technical', label: 'Technical' },
    { value: 'Business', label: 'Business' },
  ];

  const qualificationOptions = [
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Bachelor Degree', label: 'Bachelor Degree' },
    { value: 'Master Degree', label: 'Master Degree' },
    { value: 'PhD', label: 'PhD' },
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
        subjects: formData.subject ? [formData.subject] : []
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

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={user} onLogout={handleLogout} />
        <div style={{ padding: '100px 30px 30px 30px' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Add New Teacher</h1>
            <button onClick={() => navigate('/teachers')} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>Back to List</button>
          </div>

          {success && <div style={{ padding: '16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>{success}</div>}
          {error && <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <SectionHeader title="Personal Information" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                <FormInput label="Gender" name="gender" value={formData.gender} onChange={handleChange} required options={[{value:'male',label:'Male'},{value:'female',label:'Female'}]} />
                <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Optional - auto-generated if empty" />
                <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <SectionHeader title="Professional Information" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <FormInput label="Subject" name="subject" value={formData.subject} onChange={handleChange} required options={subjectOptions} />
                <FormInput label="Qualification" name="qualifications" value={formData.qualifications} onChange={handleChange} required options={qualificationOptions} />
                <FormInput label="Salary" name="salary" type="number" value={formData.salary} onChange={handleChange} />
                <FormInput label="Join Date" name="dateOfEmployment" type="date" value={formData.dateOfEmployment} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => navigate('/teachers')} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding: '12px 24px', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                {loading ? 'Saving...' : 'Add Teacher'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AddTeacher;
