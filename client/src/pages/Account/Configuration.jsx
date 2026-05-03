import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';

// Premium Icon Components
const Icons = {
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Lock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Bell: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Camera: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
};

const Configuration = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [storedUser, setStoredUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Configuration');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); }
  };

  const currentUser = storedUser || user;

  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', sans-serif" }}>
      <RoleBasedSidebar user={currentUser} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={currentUser} onLogout={handleLogout} />
        
        <main style={{ padding: '100px 40px 40px' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Account Configuration</h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Personalize your profile and security preferences</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '32px' }}>
            {/* Left Nav Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<Icons.User />} label="Profile Details" />
              <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Icons.Lock />} label="Security & Password" />
              <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<Icons.Bell />} label="Notification Settings" />
            </div>

            {/* Right Content Area */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              {activeTab === 'profile' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '100px', height: '100px', borderRadius: '30px', backgroundColor: '#00843e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '40px', fontWeight: '800' }}>
                        {formData.firstName?.[0] || 'A'}
                      </div>
                      <button style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <Icons.Camera />
                      </button>
                    </div>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{formData.firstName} {formData.lastName}</h2>
                      <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{currentUser?.role?.toUpperCase() || 'ADMINISTRATOR'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                    <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                    <InputField label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" />
                    <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
                  </div>

                  <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button style={{ padding: '12px 32px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0, 132, 62, 0.2)' }}>
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '32px' }}>Change Password</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
                    <InputField label="Current Password" type="password" />
                    <InputField label="New Password" type="password" />
                    <InputField label="Confirm New Password" type="password" />
                  </div>
                  <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button style={{ padding: '12px 32px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      Update Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      borderRadius: '16px',
      backgroundColor: active ? '#00843e' : 'white',
      color: active ? 'white' : '#64748b',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      transition: '0.2s',
      fontWeight: '600',
      boxShadow: active ? '0 10px 20px rgba(0, 132, 62, 0.2)' : '0 4px 12px rgba(0,0,0,0.02)'
    }}
  >
    <div style={{ opacity: active ? 1 : 0.7 }}>{icon}</div>
    <span style={{ fontSize: '14px' }}>{label}</span>
  </button>
);

const InputField = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{label}</label>
    <input 
      {...props} 
      style={{ 
        padding: '12px 16px', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0', 
        fontSize: '14px', 
        color: '#1e293b', 
        outline: 'none',
        backgroundColor: '#f8fafc',
        transition: '0.2s'
      }} 
      onFocus={(e) => e.target.style.borderColor = '#00843e'}
      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
    />
  </div>
);

export default Configuration;
