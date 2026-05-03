import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI, studentAPI, courseAPI, parentAPI, settingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';
import PremiumDatePicker from '../../components/common/PremiumDatePicker';
import PremiumCalendar from '../../components/common/PremiumCalendar';
import PremiumSelect from '../../components/common/PremiumSelect';

const displayGrade = (g) => {
  if (!g) return 'No Grade';
  let str = g.toString().trim();
  // Transform Primary 1-6 to Basic 1-6 for UI display
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

// Custom SVG Icons
const Icons = {
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Clock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Save: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Filter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
};

const Attendance = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Class');
  
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [storedUser, setStoredUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [pendingChanges, setPendingChanges] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [schoolSettings, setSchoolSettings] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Period schedule — each has a label, start (HH:MM 24h), end, and grace minutes before "Late"
  const PERIOD_SCHEDULE = [
    { id: 'Morning Assembly', label: 'Morning Assembly', start: '07:30', end: '07:45', grace: 5 },
    { id: 'Period 1',         label: 'Period 1',         start: '07:45', end: '08:30', grace: 5 },
    { id: 'Period 2',         label: 'Period 2',         start: '08:30', end: '09:15', grace: 5 },
    { id: 'Period 3',         label: 'Period 3',         start: '09:15', end: '10:00', grace: 5 },
    { id: 'Break',            label: 'Break',            start: '10:00', end: '10:20', grace: 0 },
    { id: 'Period 4',         label: 'Period 4',         start: '10:20', end: '11:05', grace: 5 },
    { id: 'Period 5',         label: 'Period 5',         start: '11:05', end: '11:50', grace: 5 },
    { id: 'Period 6',         label: 'Period 6',         start: '11:50', end: '12:35', grace: 5 },
    { id: 'General',          label: 'General / Other',  start: '00:00', end: '23:59', grace: 0 },
  ];

  // Convert "HH:MM" to total minutes from midnight
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  // Auto-detect which period is currently active based on real clock
  const detectCurrentPeriod = (now = new Date()) => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (const p of PERIOD_SCHEDULE) {
      if (p.id === 'General') continue;
      const start = toMinutes(p.start);
      const end   = toMinutes(p.end);
      if (nowMin >= start && nowMin < end) return p.id;
    }
    // Before school or after school — fall back to General
    return 'General';
  };

  // Derived info about the selected period
  const activePeriodInfo = PERIOD_SCHEDULE.find(p => p.id === selectedPeriod) || PERIOD_SCHEDULE[PERIOD_SCHEDULE.length - 1];

  // Progress within selected period (0–100%)
  const periodProgress = useMemo(() => {
    if (!activePeriodInfo || activePeriodInfo.id === 'General') return null;
    const start = toMinutes(activePeriodInfo.start);
    const end   = toMinutes(activePeriodInfo.end);
    const now   = currentTime.getHours() * 60 + currentTime.getMinutes();
    if (now < start) return 0;
    if (now >= end)  return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [currentTime, activePeriodInfo]);

  // Minutes into the period (used for late detection)
  const minutesIntoPeriod = useMemo(() => {
    if (!activePeriodInfo) return 0;
    const start = toMinutes(activePeriodInfo.start);
    const now   = currentTime.getHours() * 60 + currentTime.getMinutes();
    return Math.max(0, now - start);
  }, [currentTime, activePeriodInfo]);

  // Is the current time past the grace window for the active period?
  const isPastGrace = minutesIntoPeriod > (activePeriodInfo?.grace ?? 5);

  const isWeekend = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay();
    return day === 0 || day === 6; // 0=Sunday, 6=Saturday
  };

  const isSelectedWeekend = isWeekend(selectedDate);

  const currentUser = storedUser || user;
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';

  // Fetch School Settings (kept for other uses like academic year/term)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsAPI.getSettings();
        if (res.data?.success) setSchoolSettings(res.data.data);
      } catch (err) { console.error('Error fetching settings:', err); }
    };
    fetchSettings();
  }, []);

  // Live Clock — tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-detect and set the current period on first load
  useEffect(() => {
    if (!selectedPeriod) {
      setSelectedPeriod(detectCurrentPeriod());
    }
  }, []);

  const isStudent = currentUser?.role === 'student';

  const [summary, setSummary] = useState(null);

  async function fetchData() {
    try {
      setLoading(true);
      setPendingChanges({}); 

      // 1. Handle Role-Specific Student Fetching
      let targetStudents = [];
      let summaryData = null;

      if (isStudent) {
        const studentId = currentUser.studentId || currentUser.id;
        const [studentRes, summaryRes] = await Promise.all([
          studentAPI.getById(studentId),
          attendanceAPI.getSummary(studentId)
        ]);
        if (studentRes.data?.success) targetStudents = [studentRes.data.data];
        if (summaryRes.data?.success) summaryData = summaryRes.data.data;
      } else if (isParent) {
        if (linkedStudents.length === 0) {
          const parentRes = await parentAPI.getMyChildren();
          if (parentRes.data?.success) {
            const children = parentRes.data.data;
            setLinkedStudents(children);
            const initialChildId = selectedChildId || children[0]?.id;
            targetStudents = children.filter(s => s.id === initialChildId);
            
            if (initialChildId) {
              const summaryRes = await attendanceAPI.getSummary(initialChildId);
              if (summaryRes.data?.success) summaryData = summaryRes.data.data;
            }
          }
        } else {
          targetStudents = linkedStudents.filter(s => !selectedChildId || s.id === selectedChildId);
          if (selectedChildId) {
            const summaryRes = await attendanceAPI.getSummary(selectedChildId);
            if (summaryRes.data?.success) summaryData = summaryRes.data.data;
          }
        }
      }

      // 2. Fetch Records & Global Student List
      const [attRes, studentsRes] = await Promise.all([
        attendanceAPI.getByDate(selectedDate),
        (isParent || isStudent)
          ? Promise.resolve({ data: { data: targetStudents } })
          : studentAPI.getAll({ page, limit, grade: selectedClass, section: selectedSection })
      ]);

      setStudents((isParent || isStudent) ? targetStudents : (studentsRes?.data?.data || []));
      setRecords(attRes?.data?.data || []);
      setSummary(summaryData);
      
      const pagination = studentsRes?.data?.pagination || {};
      setTotalPages(pagination.pages || 1);
      setTotalStudents(pagination.total || (isParent || isStudent ? targetStudents.length : 0));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (isTeacher && currentUser?.id) {
      const fetchTeacherCourses = async () => {
        try {
          const res = await courseAPI.getByTeacher(currentUser.id);
          const courses = res.data?.data || [];
          setTeacherCourses(courses);
          if (courses.length > 0 && !selectedClass) {
            setSelectedClass(courses[0].grade);
            setSelectedSection(courses[0].section || 'A');
          }
        } catch (err) {
          console.error("Error fetching teacher courses:", err);
        }
      };
      fetchTeacherCourses();
    }
  }, [isTeacher, currentUser?.id]);

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedClass, selectedSection, page, selectedChildId, linkedStudents.length]);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); }
  };

  const getStatusDataForStudent = (studentId) => {
    if (pendingChanges[studentId]) return pendingChanges[studentId];

    const record = records.find(r => 
      r.student_id === studentId || r.student === studentId || r.student?._id === studentId
    );
    return {
      status: record?.status || 'absent',
      arrival_time: record?.arrival_time || null
    };
  };

  const handleStatusChange = (studentId, status) => {
    const now = new Date();
    const arrival_time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    setPendingChanges(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status,
        arrival_time: status === 'absent' ? null : arrival_time
      }
    }));
  };

  // Force a specific status regardless of grace window (for explicit teacher override)
  const handleForceStatus = (studentId, status) => {
    const now = new Date();
    const arrival_time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setPendingChanges(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        arrival_time: status === 'absent' ? null : arrival_time
      }
    }));
  };

  const handleMarkAll = (status) => {
    const newChanges = {};
    const now = new Date();
    const arrival_time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    students.forEach(student => {
      const id = student.id || student._id;
      newChanges[id] = {
        ...pendingChanges[id],
        status: status,
        arrival_time: status === 'absent' ? null : arrival_time
      };
    });
    setPendingChanges(prev => ({ ...prev, ...newChanges }));
  };

  const saveAttendance = async () => {
    const changeArray = Object.entries(pendingChanges).map(([studentId, data]) => ({
      student_id: studentId,
      status: data.status,
      date: selectedDate,
      period: selectedPeriod,
      arrival_time: data.arrival_time,
      notes: data.notes || ''
    }));

    if (changeArray.length === 0) return;

    try {
      setSaving(true);
      await attendanceAPI.markBulk({ records: changeArray });
      
      // Update local records state to reflect changes without a full fetch
      setRecords(prev => {
        const newRecords = [...prev];
        changeArray.forEach(change => {
          const index = newRecords.findIndex(r => r.student_id === change.student_id && r.period === change.period);
          if (index !== -1) {
            newRecords[index] = { ...newRecords[index], ...change };
          } else {
            newRecords.push(change);
          }
        });
        return newRecords;
      });

      setPendingChanges({}); // Clear pending changes as they are now committed
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      // Removed fetchData() to keep the current state/scroll position
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const stats = useMemo(() => {
    const currentStats = { present: 0, absent: 0, total: students.length };
    students.forEach(student => {
      const data = getStatusDataForStudent(student.id || student._id);
      if (data.status === 'present') currentStats.present++;
      else if (data.status === 'absent') currentStats.absent++;
    });
    return currentStats;
  }, [students, pendingChanges, records]);

  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <RoleBasedSidebar user={currentUser} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1, position: 'relative' }}>
        <TopNav user={currentUser} onLogout={handleLogout} />
        
        <main style={{ padding: '100px 40px 40px' }}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Operation Registry</span>
                  <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Daily Attendance</span>
                </div>
                <h1 style={{ fontSize: '36px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>
                  {isStudent ? 'My Attendance' : isParent ? 'Child Attendance' : 'Attendance Intelligence'}
                </h1>
                <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>
                  {isStudent ? 'Monitor your personal arrival history and punctuality records.' : 
                   isParent ? 'Track your children\'s institutional presence and daily arrival times.' : 
                   'Institutional punctuality tracking and student presence monitoring.'}
                </p>
              </div>

              
              {/* Period-Aware Time Panel — teachers/admins only, weekdays only */}
              {isTeacher && activePeriodInfo && !isSelectedWeekend && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px', minWidth: '320px' }}>
                  {/* Smart Period Matrix */}
                  {activePeriodInfo.id !== 'General' && (
                    <div className="glass-card" style={{ padding: '16px 20px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0, 132, 62, 0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', display: 'block' }}>{activePeriodInfo.label}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{activePeriodInfo.start} – {activePeriodInfo.end}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--brand-green)', display: 'block' }}>{periodProgress}%</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Completion</span>
                        </div>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          height: '100%',
                          width: `${periodProgress ?? 0}%`,
                          borderRadius: '999px',
                          background: 'linear-gradient(90deg, #00843e, #10b981)',
                          boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
                          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isPastGrace ? '#ef4444' : '#10b981', animation: 'pulse 2s infinite' }}></div>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: isPastGrace ? '#ef4444' : '#10b981', textTransform: 'uppercase' }}>
                            {isPastGrace ? 'Grace Window Expired' : `Grace Period Active (${activePeriodInfo.grace}m)`}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>{minutesIntoPeriod}m elapsed</span>
                      </div>
                    </div>
                  )}

                  {/* Temporal Sync Status */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', padding: '12px 20px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: 'var(--brand-green)', backgroundColor: 'rgba(0, 132, 62, 0.05)', padding: '8px', borderRadius: '12px' }}><Icons.Clock /></div>
                      <div>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temporal Node</p>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
                          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </div>

            {isTeacher && hasUnsavedChanges && (
              <button
                onClick={saveAttendance}
                disabled={saving || isSelectedWeekend}
                className="premium-btn-primary"
                style={{
                  padding: '14px 28px',
                  opacity: (saving || isSelectedWeekend) ? 0.6 : 1,
                  cursor: isSelectedWeekend ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : <><Icons.Save /> Commit Attendance</>}
              </button>
            )}

          </div>

          {/* Weekend Warning Banner */}
          {isSelectedWeekend && (
            <div style={{ 
              backgroundColor: '#fffbeb', 
              border: '1px solid #fde68a', 
              borderRadius: '16px', 
              padding: '16px 24px', 
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div style={{ 
                backgroundColor: '#f59e0b', 
                color: 'white', 
                width: '40px', 
                height: '40px', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.Clock />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#92400e' }}>Weekend Selected</h4>
                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '600', color: '#b45309' }}>
                  Attendance tracking is restricted to weekdays (Monday to Friday). You cannot mark or modify attendance for this date.
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
            {(isStudent || isParent) && summary ? (
              <>
                {[
                  { label: 'Attendance Rate', value: `${summary.attendancePercentage || 0}%`, color: '#059669', bg: '#ecfdf5', icon: <Icons.Check /> },
                  { label: 'Total Present', value: summary.presentDays || 0, color: '#2563eb', bg: '#eff6ff', icon: <Icons.Users /> },
                  { label: 'Total Absent', value: summary.absentDays || 0, color: '#dc2626', bg: '#fef2f2', icon: <Icons.X /> }
                ].map((stat, i) => (
                  <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                    <div style={{ backgroundColor: stat.bg, color: stat.color, padding: '12px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>{stat.icon}</div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{stat.label}</p>
                      <p style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{stat.value}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              [
                { label: 'Present', value: stats.present, color: '#059669', bg: '#ecfdf5', icon: <Icons.Check /> },
                { label: 'Absent', value: stats.absent, color: '#dc2626', bg: '#fef2f2', icon: <Icons.X /> },
                { label: 'Total Enrolled', value: stats.total, color: '#2563eb', bg: '#eff6ff', icon: <Icons.Users /> }
              ].map((stat, i) => (
                <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                  <div style={{ backgroundColor: stat.bg, color: stat.color, padding: '12px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>{stat.icon}</div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{stat.label}</p>
                    <p style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{stat.value}</p>
                  </div>
                </div>
              ))
            )}
          </div>


          {/* Intelligence Matrix Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {!isParent && !isStudent && (
                    <div style={{ flex: 1 }}>
                      <label className="premium-label">Temporal Period</label>
                      <PremiumSelect
                        value={selectedPeriod}
                        onChange={(e) => { setSelectedPeriod(e.target.value); setPendingChanges({}); }}
                        options={PERIOD_SCHEDULE.map(p => ({
                          value: p.id,
                          label: `${p.label}${p.id !== 'General' ? ` · ${p.start}–${p.end}` : ''}`
                        }))}
                      />
                    </div>
                  )}
                  {isParent && linkedStudents.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <label className="premium-label">Select Student Profile</label>
                      <PremiumSelect
                        value={selectedChildId}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        options={linkedStudents.map(c => ({
                          value: c.id,
                          label: `${c.firstName || c.first_name} ${c.lastName || c.last_name}`
                        }))}
                        placeholder="Select Student"
                      />
                    </div>
                  )}
                  {!isParent && !isStudent && (
                    <>
                      <div style={{ width: '180px' }}>
                        <label className="premium-label">Grade Node</label>
                        <PremiumSelect
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          options={isTeacher ? (
                            [...new Set(teacherCourses.map(c => c.grade))].map(grade => ({ value: grade, label: grade }))
                          ) : (
                            ['KG 1', 'KG 2', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'JHS 1', 'JHS 2', 'JHS 3'].map(g => ({ value: g, label: displayGrade(g) }))
                          )}
                          placeholder="Class"
                        />
                      </div>
                      <div style={{ width: '120px' }}>
                        <label className="premium-label">Division</label>
                        <PremiumSelect
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          options={isTeacher ? (
                            teacherCourses
                              .filter(c => c.grade === selectedClass)
                              .map(c => ({ value: c.section, label: c.section }))
                          ) : (
                            ['A', 'B', 'C'].map(s => ({ value: s, label: s }))
                          )}
                          placeholder="Sec"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Search /></div>
                    <input
                      type="text"
                      placeholder="Filter student matrix..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="premium-input"
                      style={{ paddingLeft: '48px', width: '100%' }}
                    />
                  </div>
                  {isTeacher && (
                    <button 
                      onClick={() => handleMarkAll('present')} 
                      disabled={isSelectedWeekend}
                      className="premium-btn-secondary"
                      style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}
                    >
                      Mark All Present
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <PremiumCalendar 
                value={selectedDate} 
                onChange={(val) => setSelectedDate(val)} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', animation: 'pulse 1.5s infinite' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#f1f5f9' }} />
                      <div style={{ width: '140px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px' }} />
                      <div style={{ width: '200px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '12px' }} />
                    </div>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '80px', textAlign: 'center', color: '#94a3b8', backgroundColor: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                    <div style={{ marginBottom: '16px', opacity: 0.5 }}><Icons.Users /></div>
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>No students match your criteria</p>
                  </div>
                ) : filteredStudents.map((student) => {
                  const studentId = student.id || student._id;
                  const data = getStatusDataForStudent(studentId);
                  const isPending = !!pendingChanges[studentId];
                  const statusColor = data.status === 'present' ? '#10b981' : '#ef4444';

                  return (
                    <div
                      key={studentId}
                      className="attendance-card"
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        padding: '32px 24px',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '20px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        boxShadow: isPending ? `0 15px 35px ${statusColor}15` : '0 4px 15px rgba(0,0,0,0.02)',
                        zIndex: isPending ? 2 : 1
                      }}
                    >
                      {/* Arrival Badge */}
                      <div style={{ 
                        position: 'absolute', 
                        top: '16px', 
                        right: '16px',
                        padding: '4px 10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#475569',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Icons.Clock /> {data.arrival_time || '--:--'}
                      </div>

                      <div style={{
                        width: '88px', height: '88px', borderRadius: '32px',
                        background: `linear-gradient(135deg, ${statusColor}10 0%, ${statusColor}20 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: statusColor, fontWeight: '900', fontSize: '28px',
                        border: `3px solid ${statusColor}15`,
                        boxShadow: `0 10px 20px ${statusColor}10`
                      }}>
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </div>

                      <div style={{ width: '100%' }}>
                        <h4 style={{ fontWeight: '900', color: '#0f172a', fontSize: '18px', letterSpacing: '-0.5px', margin: '0 0 4px 0' }}>
                          {student.firstName} {student.lastName}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {student.admissionNumber || 'ADM-NODE'}
                        </div>
                      </div>

                      <div style={{ 
                        width: '100%', 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        backgroundColor: '#f1f5f9', 
                        padding: '6px', 
                        borderRadius: '18px', 
                        gap: '6px' 
                      }}>
                        {[
                          { id: 'present', label: 'Present', color: '#10b981', bg: 'white', icon: <Icons.Check /> },
                          { id: 'absent', label: 'Absent', color: '#ef4444', bg: 'white', icon: <Icons.X /> }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => handleStatusChange(studentId, opt.id)}
                            disabled={isSelectedWeekend}
                            className={`attendance-action-btn ${data.status === opt.id ? 'active' : ''}`}
                            style={{
                              padding: '12px',
                              border: 'none',
                              borderRadius: '14px',
                              fontSize: '13px',
                              fontWeight: '900',
                              cursor: isSelectedWeekend ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                              backgroundColor: data.status === opt.id ? opt.bg : 'transparent',
                              color: data.status === opt.id ? opt.color : '#64748b',
                              boxShadow: data.status === opt.id ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Bottom Feedback Bar */}
          {showSuccess && (
            <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '16px 32px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 1000, animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ color: '#10b981' }}><Icons.Check /></div>
              <span style={{ fontWeight: '600' }}>Attendance for <strong>{selectedPeriod}</strong> saved successfully!</span>
            </div>
          )}

          {/* Styles for animation */}
          <style>{`
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            @keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
            
            .attendance-card:hover {
              transform: translateY(-4px) !important;
              box-shadow: 0 12px 30px rgba(0,0,0,0.06) !important;
              border-color: var(--brand-green-light) !important;
            }
            
            .attendance-action-btn:hover {
              transform: scale(1.05);
            }
            
            .attendance-action-btn.active {
              animation: buttonPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            
            @keyframes buttonPop {
              0% { transform: scale(0.9); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
          `}</style>
        </main>
      </div>
    </div>
  );
};

export default Attendance;