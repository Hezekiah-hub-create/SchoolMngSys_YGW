import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parentAPI } from '../../services/api';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';
import PremiumDatePicker from '../../components/common/PremiumDatePicker';
import PremiumSelect from '../../components/common/PremiumSelect';

const Calendar = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [storedUser, setStoredUser] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'event', description: '' });

  const role = storedUser?.role || user?.role;
  const isParent = role === 'parent';
  const isStudent = role === 'student';
  const isAdmin = role === 'admin' || role === 'staff' || role === 'ITSupport' || role === 'teacher';

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  useEffect(() => {
    const saved = localStorage.getItem('authUser');
    if (saved) { try { setStoredUser(JSON.parse(saved)); } catch (e) {} }
    if (isParent) fetchAnnouncements();
  }, [isParent]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await parentAPI.getMyChildrenAnnouncements();
      if (res.data?.data) setEvents(res.data.data.map(e => ({ ...e, type: 'announcement', color: '#00843e' })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const defaultEvents = [
    { id: 1, title: 'Mathematics Exam', date: '2024-01-15', type: 'exam', color: '#ef4444', time: '09:00 AM' },
    { id: 2, title: 'Sports Day', date: '2024-01-20', type: 'event', color: '#00843e', time: '07:00 AM' },
    { id: 3, title: 'Parent-Teacher Meeting', date: '2024-01-22', type: 'meeting', color: '#00843e', time: '10:00 AM' },
    { id: 4, title: 'Science Fair', date: '2024-01-25', type: 'event', color: '#00843e', time: '08:00 AM' },
    { id: 5, title: 'English Test', date: '2024-01-18', type: 'exam', color: '#ef4444', time: '09:00 AM' },
    { id: 6, title: 'Staff Development Day', date: '2024-01-28', type: 'holiday', color: '#facc15', time: 'All Day' },
    { id: 7, title: 'Christmas Break', date: '2024-01-10', type: 'holiday', color: '#facc15', time: 'All Day' },
  ];

  const displayEvents = events.length > 0 ? events : defaultEvents;

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return displayEvents.filter(e => e.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={user} onLogout={handleLogout} />
        <div style={{ padding: '100px 30px 30px 30px' }}>
          <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div><h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>School Calendar</h1><p style={{ fontSize: '15px', color: '#64748b', marginTop: '0', fontWeight: '500' }}>View school events and academic calendar</p></div>
            {!isStudent && (
              <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', backgroundColor: '#00843e', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 15px rgba(0, 132, 62, 0.3)', transition: 'all 0.2s' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Add Event</button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={prevMonth} style={{ padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <button onClick={nextMonth} style={{ padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></button>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {dayNames.map(day => (<div key={day} style={{ textAlign: 'center', padding: '10px', fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{day}</div>))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {[...Array(startingDay)].map((_, i) => (<div key={`empty-${i}`} style={{ padding: '12px', minHeight: '90px' }}></div>))}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDay(day);
                    const today = new Date();
                    const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
                    return (
                      <div key={day} style={{ padding: '10px', minHeight: '90px', borderRadius: '12px', backgroundColor: isToday ? '#dcfce7' : '#f8fafc', border: isToday ? '2px solid #00843e' : '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '14px', fontWeight: isToday ? '700' : '500', color: isToday ? '#00843e' : '#1e293b', marginBottom: '6px' }}>{day}</div>
                        {dayEvents.slice(0, 2).map(event => (
                          <div key={event.id || event._id} style={{ padding: '4px 6px', backgroundColor: `${event.color}15`, borderRadius: '6px', marginBottom: '4px', fontSize: '11px', color: event.color, fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
                        ))}
                        {dayEvents.length > 2 && <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>+{dayEvents.length - 2} more</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {isAdmin && !isStudent && (
                <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)', padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', letterSpacing: '-0.5px' }}>Add New Event</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Title</label>
                      <input 
                        type="text" 
                        placeholder="Enter title" 
                        className="premium-input"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        style={{ padding: '10px 14px' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</label>
                        <PremiumDatePicker 
                          value={newEvent.date} 
                          onChange={(val) => setNewEvent({ ...newEvent, date: val })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
                        <PremiumSelect
                          value={newEvent.type}
                          onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                          options={[
                            { value: 'event', label: 'School Event' },
                            { value: 'exam', label: 'Examination' },
                            { value: 'meeting', label: 'Meeting' },
                            { value: 'holiday', label: 'Holiday' }
                          ]}
                        />
                      </div>
                    </div>
                    <button style={{ padding: '12px', backgroundColor: '#00843e', border: 'none', borderRadius: '12px', cursor: 'pointer', color: 'white', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 15px rgba(0, 132, 62, 0.2)', transition: 'all 0.2s', marginTop: '4px' }}>
                      Add to Calendar
                    </button>
                  </div>
                </div>
              )}

              <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Event Legend</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#ef4444' }}></div><span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Examinations</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#00843e' }}></div><span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>School Events</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#00843e' }}></div><span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Meetings</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#00843e' }}></div><span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Activities</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#facc15' }}></div><span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Holidays</span></div>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Upcoming Events</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {displayEvents.slice(0, 5).map(event => (
                    <div key={event.id || event._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '12px', transition: 'all 0.2s' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${event.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={event.color} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>{event.title}</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '500' }}>{event.date} • {event.time || 'All Day'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        input:focus, select:focus, textarea:focus {
          border-color: #00843e !important;
          box-shadow: 0 0 0 4px rgba(0, 132, 62, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default Calendar;
