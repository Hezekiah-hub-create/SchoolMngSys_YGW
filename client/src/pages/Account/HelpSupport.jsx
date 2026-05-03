import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';

// Premium Icon Components
const Icons = {
  Help: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Book: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Message: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
};

const HelpSupport = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [storedUser, setStoredUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Help & Support');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); }
  };

  const currentUser = storedUser || user;

  const faqs = [
    { q: "How do I reset my password?", a: "You can reset your password in the Configuration tab under Account settings. Look for the 'Security' section." },
    { q: "How do I record student attendance?", a: "Navigate to the Attendance page from the sidebar, select the class and date, and mark students as present or absent." },
    { q: "Where can I view my class timetable?", a: "The Timetable page shows your weekly schedule. You can access it from the Academic menu in the sidebar." },
    { q: "How are grades calculated?", a: "Grades are calculated based on the assessment weights defined in the Course settings. The total score is a sum of class assignments, mid-semester exams, and final exams." }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', sans-serif" }}>
      <RoleBasedSidebar user={currentUser} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={currentUser} onLogout={handleLogout} />
        
        <main style={{ padding: '100px 40px 40px' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Help & Support</h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Find answers, documentation, and technical assistance</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            {/* Left Column - FAQs */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '10px', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '12px' }}><Icons.Help /></div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Frequently Asked Questions</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {faqs.map((faq, index) => (
                  <div key={index} style={{ border: '1px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      style={{ width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{faq.q}</span>
                      <div style={{ transform: expandedFaq === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', color: '#94a3b8' }}><Icons.ChevronDown /></div>
                    </button>
                    {expandedFaq === index && (
                      <div style={{ padding: '0 20px 20px', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Contact & Docs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Contact Card */}
              <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Contact Support</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
                    <div style={{ color: '#10b981' }}><Icons.Phone /></div>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Technical Desk</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '2px 0 0' }}>+233 (0) 24 000 0000</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
                    <div style={{ color: '#8b5cf6' }}><Icons.Message /></div>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Email Support</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '2px 0 0' }}>support@uhas.edu.gh</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Card */}
              <div style={{ backgroundColor: '#00843e', borderRadius: '24px', padding: '28px', color: 'white', boxShadow: '0 20px 40px rgba(0, 132, 62, 0.2)' }}>
                <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
                  <Icons.Book />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>User Manual</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', marginBottom: '20px' }}>Download the complete guide for teachers, administrators, and parents.</p>
                <button style={{ width: '100%', padding: '12px', backgroundColor: 'white', color: '#00843e', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HelpSupport;
