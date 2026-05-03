import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { parentAPI, studentAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import TopNav from '../../../components/layout/TopNav';

const Icons = {
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Briefcase: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="3"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const ParentProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Parents');
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchParentData(); }, [id]);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const parentRes = await parentAPI.getById(id);
      if (parentRes.data?.success) {
        const p = parentRes.data.data;
        const normalizedParent = {
          ...p,
          firstName: p.firstName || p.first_name,
          lastName: p.lastName || p.last_name,
          studentIds: p.studentIds || p.student_ids || []
        };
        setParent(normalizedParent);

        // Fetch children data
        if (normalizedParent.studentIds.length > 0) {
          const childrenData = await Promise.all(
            normalizedParent.studentIds.map(sid => studentAPI.getById(sid))
          );
          setChildren(childrenData.map(res => res.data.data).filter(Boolean));
        }
      }
    } catch (err) { console.error('Error fetching parent data:', err); }
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
      firstName: parent?.firstName || '',
      lastName: parent?.lastName || '',
      email: parent?.email || '',
      phone: parent?.phone || '',
      occupation: parent?.occupation || '',
      relationship: parent?.relationship || '',
      address: parent?.address || '',
      receive_sms: parent?.receive_sms ?? true,
      receive_email: parent?.receive_email ?? true
    });
    setIsEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      await parentAPI.update(id, editFormData);
      setSuccess('Parent profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditing(false);
      fetchParentData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update parent');
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
                onClick={() => navigate('/parents')} 
                className="premium-btn-secondary"
                style={{ width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icons.ArrowLeft />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#fff7ed', color: '#9a3412', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Guardian Node</span>
                  <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Family Governance</span>
                </div>
                <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>
                  {parent?.firstName} <span style={{ color: 'var(--brand-yellow)' }}>{parent?.lastName}</span>
                </h1>
                <p style={{ fontSize: '16px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>Administering family records and legal guardianship for the {parent?.lastName} lineage.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {isEditing ? (
                <>
                  <button onClick={handleSaveEdit} disabled={saving} className="premium-btn-primary">
                    {saving ? <div className="mini-spinner"></div> : <Icons.Check />}
                    Commit Registry
                  </button>
                  <button onClick={() => setIsEditing(false)} className="premium-btn-secondary">
                    <Icons.X />
                    Abort
                  </button>
                </>
              ) : (
                <button onClick={startEdit} className="premium-btn-primary">
                  <Icons.Edit />
                  Update Registry
                </button>
              )}
            </div>
          </div>


          {success && <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #10b981', fontWeight: '500' }}>{success}</div>}
          {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #ef4444', fontWeight: '500' }}>{error}</div>}

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
                  boxShadow: '0 20px 40px rgba(245, 158, 11, 0.2)',
                  border: '4px solid white'
                }}>
                  {parent?.firstName?.[0]}{parent?.lastName?.[0]}
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>{parent?.firstName} {parent?.lastName}</h2>
                <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', fontWeight: '600' }}>{parent?.relationship || 'Guardian'}</p>

                <div style={{ marginTop: '40px', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '40px', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Identity Registry</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <InfoRow icon={<Icons.Phone />} label="Institutional Line" value={parent?.phone} />
                    <InfoRow icon={<Icons.Mail />} label="Electronic Mail" value={parent?.email} />
                    <InfoRow icon={<Icons.Briefcase />} label="Occupational Node" value={parent?.occupation} />
                    <InfoRow icon={<Icons.Users />} label="Linked Scholars" value={`${children.length} Registered`} />
                  </div>
                </div>
              </div>
            </aside>


            {/* Main Content Area */}
            <section>
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {!isEditing && (
                  <div style={{ display: 'flex', padding: '0 32px', backgroundColor: 'var(--brand-slate-50)', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    {['personal', 'communication', 'students'].map(tab => (
                      <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        style={{ 
                          padding: '24px 32px', 
                          border: 'none', 
                          background: 'none', 
                          fontSize: '13px', 
                          fontWeight: '900', 
                          color: activeTab === tab ? 'var(--brand-yellow)' : '#94a3b8', 
                          borderBottom: activeTab === tab ? '3px solid var(--brand-yellow)' : '3px solid transparent', 
                          cursor: 'pointer', 
                          transition: 'all 0.2s', 
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}
                      >
                        {tab} Node
                      </button>
                    ))}
                  </div>
                )}


                <div style={{ padding: '40px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      <FormSection title="Parent Identity" icon={<Icons.User />}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                          <FormGroup label="First Name" name="firstName" value={editFormData.firstName} onChange={handleEditChange} />
                          <FormGroup label="Last Name" name="lastName" value={editFormData.lastName} onChange={handleEditChange} />
                          <FormGroup label="Relationship" name="relationship" value={editFormData.relationship} onChange={handleEditChange} type="select" options={[{value:'father', label:'Father'}, {value:'mother', label:'Mother'}, {value:'guardian', label:'Guardian'}]} />
                          <FormGroup label="Occupation" name="occupation" value={editFormData.occupation} onChange={handleEditChange} />
                        </div>
                      </FormSection>

                      <FormSection title="Contact Info" icon={<Icons.Phone />}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                          <FormGroup label="Email" name="email" value={editFormData.email} onChange={handleEditChange} />
                          <FormGroup label="Phone" name="phone" value={editFormData.phone} onChange={handleEditChange} />
                          <FormGroup label="Address" name="address" value={editFormData.address} onChange={handleEditChange} />
                        </div>
                      </FormSection>

                      <FormSection title="Communication Protocols" icon={<Icons.Mail />}>
                        <div style={{ display: 'flex', gap: '32px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '12px 16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--brand-slate-100)' }}>
                            <input type="checkbox" name="receive_sms" checked={editFormData.receive_sms} onChange={handleEditChange} style={{ width: '18px', height: '18px', accentColor: 'var(--brand-yellow)' }} />
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>SMS Alert Matrix</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '12px 16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--brand-slate-100)' }}>
                            <input type="checkbox" name="receive_email" checked={editFormData.receive_email} onChange={handleEditChange} style={{ width: '18px', height: '18px', accentColor: 'var(--brand-yellow)' }} />
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Email Broadcast Synchrony</span>
                          </label>
                        </div>
                      </FormSection>

                    </div>
                  ) : (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                      {activeTab === 'personal' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                          <DataBlock label="Legal Relationship" value={parent?.relationship} />
                          <DataBlock label="Occupational Node" value={parent?.occupation} />
                          <DataBlock label="Electronic Mail" value={parent?.email} />
                          <DataBlock label="Institutional Line" value={parent?.phone} />
                          <DataBlock 
                            label="Residential Node" 
                            value={
                              typeof parent?.address === 'object' && parent?.address !== null
                                ? `${parent.address.street || ''}, ${parent.address.city || ''}, ${parent.address.state || ''} ${parent.address.zipCode || ''}`.replace(/^, |, ,/g, '').trim()
                                : parent?.address
                            } 
                            fullWidth 
                          />
                        </div>
                      )}
                      {activeTab === 'communication' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                          <DataBlock label="SMS Broadcast Protocols" value={parent?.receive_sms ? 'Synchronized' : 'Deactivated'} />
                          <DataBlock label="Email Alert Matrix" value={parent?.receive_email ? 'Synchronized' : 'Deactivated'} />
                          <DataBlock label="Linguistic Preference" value={parent?.preferred_language || 'English'} />
                        </div>
                      )}
                      {activeTab === 'students' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                          {children.length > 0 ? children.map(child => (
                            <Link 
                              key={child.id} 
                              to={`/students/${child.id}`}
                              className="glass-card"
                              style={{ 
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                padding: '24px',
                                transition: 'all 0.3s ease',
                                border: '1px solid var(--brand-slate-100)'
                              }}
                            >
                              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--brand-yellow)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px' }}>
                                {child.first_name?.[0] || child.firstName?.[0]}
                              </div>
                              <div>
                                <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{child.first_name || child.firstName} {child.last_name || child.lastName}</p>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', fontWeight: '600' }}>{child.grade} • {child.admission_number || child.admissionNumber}</p>
                              </div>
                            </Link>
                          )) : (
                            <p style={{ color: '#64748b', gridColumn: 'span 2', textAlign: 'center', padding: '40px' }}>No institutional scholars registered under this guardian node.</p>
                          )}
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
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #00843e; border-radius: 50%; animation: spin 1s linear infinite; }
        .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

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
      <div style={{ color: 'var(--brand-yellow)' }}>{icon}</div>
      <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>{title}</h4>
    </div>
    {children}
  </div>
);


const FormGroup = ({ label, name, value, onChange, type = 'text', options = [] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{label}</label>
    {type === 'select' ? (
      <select name={name} value={value || ''} onChange={onChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', backgroundColor: 'white' }}>
        <option value="">Select Option</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.v || opt.value || ''}>
            {opt.l || opt.label || ''}
          </option>
        ))}
      </select>
    ) : (
      <input type={type} name={name} value={value || ''} onChange={onChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px' }} />
    )}
  </div>
);

const DataBlock = ({ label, value, fullWidth = false }) => (
  <div style={{ gridColumn: fullWidth ? 'span 2' : 'auto' }}>
    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</p>
    <p style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', margin: 0 }}>{value || 'Institutional Null'}</p>
  </div>
);


export default ParentProfile;
