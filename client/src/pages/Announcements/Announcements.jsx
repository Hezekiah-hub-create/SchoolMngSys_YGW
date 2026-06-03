import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parentAPI } from '../../services/api';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';

// Premium Icon Components
const Icons = {
  Bell: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  ArrowRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Megaphone: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h3a1 1 0 0 0 1-1V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-2a1 1 0 0 0-1-1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><path d="M2 8h3v8H2z"/><path d="M10 12h.01"/></svg>,
};

const Announcements = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const isParent = user?.role === 'parent';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch announcements
      let announceRes;
      if (isParent) {
        announceRes = await parentAPI.getMyChildrenAnnouncements();
        const childrenRes = await parentAPI.getMyChildren();
        if (childrenRes.data?.success) setLinkedStudents(childrenRes.data.data);
      } else {
        // Fallback for non-parents if needed
        announceRes = { data: { data: [] } }; 
      }
      
      setAnnouncements(announceRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken');
      navigate('/login');
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = ann.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ann.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChild = selectedChildId === 'all' || ann.studentId === selectedChildId || ann.target === 'school';
    const matchesType = filterType === 'all' || ann.type === filterType;
    return matchesSearch && matchesChild && matchesType;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', sans-serif" }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={user} onLogout={handleLogout} />
        
        <main style={{ padding: '100px 40px 40px' }}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Announcements</h1>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Stay updated with the latest school news and child-specific notifications</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Search /></div>
                <input 
                  type="text" 
                  placeholder="Search announcements..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '12px 16px 12px 44px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', width: '260px', backgroundColor: 'white', transition: 'all 0.2s' }} 
                />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {isParent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '8px 16px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>VIEWING FOR:</span>
                <select 
                  value={selectedChildId} 
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  style={{ border: 'none', fontSize: '14px', fontWeight: '700', color: '#00843e', outline: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                >
                  <option value="all">All Children</option>
                  {linkedStudents.map(child => (
                    <option key={child.id} value={child.id}>{child.firstName} {child.lastName}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'urgent', 'school', 'class', 'academic'].map(type => (
                <button 
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{ 
                    padding: '10px 20px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    fontSize: '13px', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    backgroundColor: filterType === type ? '#00843e' : 'white',
                    color: filterType === type ? 'white' : '#64748b',
                    boxShadow: filterType === type ? '0 10px 20px rgba(0, 132, 62, 0.2)' : 'none',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ height: '160px', backgroundColor: 'white', borderRadius: '24px', animation: 'pulse 1.5s infinite' }}></div>
              ))
            ) : filteredAnnouncements.length === 0 ? (
              <div style={{ padding: '80px', textAlign: 'center', backgroundColor: 'white', borderRadius: '24px' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Icons.Bell />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px' }}>No announcements found</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Try adjusting your filters or search terms</p>
              </div>
            ) : (
              filteredAnnouncements.map((ann, idx) => (
                <AnnouncementCard key={ann.id || idx} announcement={ann} />
              ))
            )}
          </div>
        </main>
      </div>
      
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
};

const AnnouncementCard = ({ announcement }) => {
  const isUrgent = announcement.type === 'urgent';
  
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '24px', 
      padding: '32px', 
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: isUrgent ? '2px solid #ef4444' : '1px solid #f1f5f9',
      display: 'flex',
      gap: '24px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {isUrgent && (
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '6px 16px', backgroundColor: '#ef4444', color: 'white', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', borderBottomLeftRadius: '12px' }}>
          Urgent
        </div>
      )}
      
      <div style={{ 
        width: '64px', 
        height: '64px', 
        borderRadius: '18px', 
        backgroundColor: isUrgent ? '#fef2f2' : '#f0fdf4', 
        color: isUrgent ? '#ef4444' : '#00843e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icons.Megaphone />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{announcement.title}</h3>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                <Icons.Calendar /> {new Date(announcement.date || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                <Icons.User /> By: {announcement.author || 'School Administration'}
              </div>
            </div>
          </div>
          <span style={{ 
            padding: '6px 12px', 
            backgroundColor: '#ffffff', 
            borderRadius: '10px', 
            fontSize: '11px', 
            fontWeight: '700', 
            color: '#64748b',
            textTransform: 'uppercase'
          }}>
            {announcement.target || 'General'}
          </span>
        </div>
        
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '16px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {announcement.content || announcement.description}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#1e293b', cursor: 'pointer', transition: 'all 0.2s' }}>
            Read Full Announcement <Icons.ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
