import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Image, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  Users, User, BookOpen, UserPlus, CheckSquare, Settings, Activity, FileText, Banknote, GraduationCap, ArrowRight, TrendingUp, PieChart, CreditCard, Calendar, LogOut, ChevronRight, Bell
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumAlert from '../components/PremiumAlert';
import { studentAPI, teacherAPI, staffAPI, subjectAPI, attendanceAPI, academicCalendarAPI, parentAPI } from '../api';

const displayGrade = (g) => {
  if (!g) return '';
  const str = g.toString().trim();
  if (str.toUpperCase() === 'JHS 1') return 'Basic 7';
  if (str.toUpperCase() === 'JHS 2') return 'Basic 8';
  if (str.toUpperCase() === 'JHS 3') return 'Basic 9';
  return str.replace(/Primary|Basic/i, 'Basic');
};

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ students: 0, teachers: 0, staff: 0, subjects: 0, attendance: 0, parents: 0 });
  const [events, setEvents] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [myChildren, setMyChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const role = user?.role || 'student';
  const isAdmin = role === 'admin' || role === 'staff' || role === 'ITSupport';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch calendar events
      const calRes = await academicCalendarAPI.getAll({ limit: 5 }).catch(() => null);
      if (calRes?.data?.success) setEvents(calRes.data.data.slice(0, 4));

      if (isAdmin) {
        const [studRes, teachRes, staffRes, subRes, attRes, parRes] = await Promise.all([
          studentAPI.getAll({ limit: 1000 }).catch(() => ({ data: { data: [] } })),
          teacherAPI.getAll({ limit: 1000 }).catch(() => ({ data: { data: [] } })),
          staffAPI.getAll({ limit: 1000 }).catch(() => ({ data: { data: [] } })),
          subjectAPI.getAll().catch(() => ({ data: { data: [] } })),
          attendanceAPI.getAll({ date: today }).catch(() => ({ data: { data: [] } })),
          parentAPI.getAll({ limit: 1000 }).catch(() => ({ data: { data: [] } })),
        ]);

        const students = studRes?.data?.data || [];
        const teachers = teachRes?.data?.data || [];
        const staffList = staffRes?.data?.data || [];
        const subjects = subRes?.data?.data || [];
        const attendance = attRes?.data?.data || [];
        const parents = parRes?.data?.data || [];

        const present = attendance.filter(r => r.status === 'present').length;
        const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;

        setStats({
          students: students.length,
          teachers: teachers.length,
          staff: staffList.length,
          subjects: subjects.length,
          attendance: attRate,
          parents: parents.length,
        });
        setRecentStudents(students.slice(0, 4));
      }

      if (role === 'parent') {
        const childRes = await parentAPI.getMyChildren().catch(() => null);
        setMyChildren(childRes?.data?.data || []);
      }
    } catch (e) {
      console.log('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const MetricCard = ({ title, value, icon: Icon, color, delay = 0 }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay }}
      style={styles.metricCard}
    >
      <View style={[styles.metricIconBox, { backgroundColor: `${color}15` }]}>
        <Icon color={color} size={22} />
      </View>
      <Text style={styles.metricLabel}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </MotiView>
  );

  const handleModulePress = (route, title) => {
    if (route) {
      navigation.navigate(route);
    } else {
      setAlertConfig({ title: `${title} Coming Soon`, message: `The ${title} module is currently under development for mobile.` });
      setComingSoon(true);
    }
  };

  const ALL_MODULES = [
    { id: 'students', title: 'Students', icon: Users, color: '#00843e', roles: ['admin', 'staff', 'teacher'], route: isAdmin ? 'AdminStudentsList' : 'Academics' },
    { id: 'staff', title: 'Staff', icon: User, color: '#3b82f6', roles: ['admin'], route: 'AdminStaffList' },
    { id: 'academic', title: 'Academic', icon: BookOpen, color: '#ec4899', roles: ['admin', 'staff', 'teacher', 'parent', 'student'], route: 'Academics' },
    { id: 'parents', title: 'Parents', icon: UserPlus, color: '#8b5cf6', roles: ['admin', 'staff'], route: 'AdminParentsList' },
    { id: 'attendance', title: 'Attendance', icon: CheckSquare, color: '#10b981', roles: ['admin', 'staff', 'teacher', 'parent', 'student'], route: role === 'teacher' ? 'TeacherAttendance' : null },
    { id: 'exams', title: 'Exams & Results', icon: GraduationCap, color: '#f59e0b', roles: ['student', 'teacher', 'parent', 'admin', 'superadmin'], route: 'AdminExams' },
    { id: 'fees', title: 'Fees & Finance', icon: Banknote, color: '#10b981', roles: ['parent', 'admin', 'superadmin'], route: 'AdminFees' },
    { id: 'reports', title: 'Reports', icon: FileText, color: '#06b6d4', roles: ['student', 'teacher', 'parent', 'admin', 'superadmin'], route: 'AdminReports' },
    { id: 'settings', title: 'Settings', icon: Settings, color: '#64748b', roles: ['admin', 'superadmin'], route: 'AdminSettings' },
    { id: 'logs', title: 'Activity Logs', icon: Activity, color: '#ef4444', roles: ['admin', 'superadmin'], route: 'AdminLogs' }
  ];

  const permittedModules = ALL_MODULES.filter(m => m.roles.includes(role));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER ===== */}
        <LinearGradient
          colors={['#00843e', '#006b32', '#0f4a2e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 2, y: 2 }}
          style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>
                {user?.first_name
                  ? `${user.first_name} ${user.last_name || ''}`.trim()
                  : user?.name || user?.email?.split('@')[0] || 'Welcome'}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{role.toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <LogOut color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ===== METRICS ===== */}
        {isAdmin && (
          <View style={styles.metricsGrid}>
            <MetricCard title="Students" value={stats.students} icon={Users} color={COLORS.primary} delay={0} />
            <MetricCard title="Teachers" value={stats.teachers} icon={GraduationCap} color="#8b5cf6" delay={100} />
            <MetricCard title="Subjects" value={stats.subjects} icon={BookOpen} color="#f59e0b" delay={200} />
            <MetricCard title="Attendance" value={`${stats.attendance}%`} icon={Activity} color="#06b6d4" delay={300} />
          </View>
        )}

        {/* ===== MODULES GRID ===== */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
        >
          <Text style={styles.sectionTitle}>Modules</Text>
          <View style={styles.modulesGrid}>
            {permittedModules.map((mod) => (
              <TouchableOpacity 
                key={mod.id} 
                style={styles.moduleCard} 
                activeOpacity={0.7}
                onPress={() => handleModulePress(mod.route, mod.title)}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: `${mod.color}15` }]}>
                  <mod.icon color={mod.color} size={24} />
                </View>
                <Text style={styles.moduleCardText}>{mod.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* ===== UPCOMING EVENTS ===== */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 500 }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {events.length > 0 ? events.map((event, idx) => (
              <View key={event.id || idx} style={[styles.eventItem, idx < events.length - 1 && styles.eventItemBorder]}>
                <View style={[styles.eventDateBox, { backgroundColor: event.is_holiday ? '#fef2f2' : '#ecfdf5' }]}>
                  <Text style={[styles.eventDateText, { color: event.is_holiday ? '#ef4444' : COLORS.primary }]}>
                    {formatDate(event.start_date)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventDesc} numberOfLines={1}>{event.description || 'No description'}</Text>
                </View>
                <ChevronRight color={COLORS.slate[400]} size={16} />
              </View>
            )) : (
              <Text style={styles.emptyText}>No upcoming events</Text>
            )}
          </View>
        </MotiView>

        {/* ===== RECENT STUDENTS (Admin only) ===== */}
        {isAdmin && recentStudents.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 600 }}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Students</Text>
            </View>
            <View style={styles.card}>
              {recentStudents.map((student, idx) => {
                const name = `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`.trim();
                return (
                  <View key={student.id || idx} style={[styles.recentItem, idx < recentStudents.length - 1 && styles.eventItemBorder]}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{getInitials(name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentName} numberOfLines={1}>{name}</Text>
                      <Text style={styles.recentSub}>{displayGrade(student.grade) || 'No grade'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: student.status === 'active' ? '#ecfdf5' : '#fef2f2' }]}>
                      <Text style={[styles.statusText, { color: student.status === 'active' ? '#10b981' : '#ef4444' }]}>
                        {student.status || 'active'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </MotiView>
        )}

        {/* ===== PARENT: MY CHILDREN ===== */}
        {role === 'parent' && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 600 }}
          >
            <Text style={styles.sectionTitle}>My Children</Text>
            {myChildren.length > 0 ? myChildren.map((child, idx) => {
              const name = `${child.firstName || child.first_name || ''} ${child.lastName || child.last_name || ''}`.trim();
              const childColors = [COLORS.primary, '#6366f1', '#f59e0b', '#ef4444'];
              const cc = childColors[idx % childColors.length];
              return (
                <MotiView
                  key={child.id || idx}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: idx * 80 }}
                  style={[styles.childCard, { borderLeftColor: cc, borderLeftWidth: 4 }]}
                >
                  <View style={[styles.childAvatar, { backgroundColor: `${cc}20` }]}>
                    <Text style={[styles.childAvatarText, { color: cc }]}>{getInitials(name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>{name}</Text>
                    <Text style={styles.childMeta}>{displayGrade(child.grade) || 'No grade'} {child.section ? `• Section ${child.section}` : ''}</Text>
                    <View style={[styles.childStatusBadge, { backgroundColor: child.status === 'active' ? '#ecfdf5' : '#fef2f2' }]}>
                      <Text style={[styles.childStatusText, { color: child.status === 'active' ? '#10b981' : '#ef4444' }]}>
                        {child.status || 'active'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.childActions}>
                    <TouchableOpacity
                      style={styles.childActionBtn}
                      onPress={() => navigation.navigate('Academics')}
                    >
                      <BarChart3 size={16} color={cc} />
                      <Text style={[styles.childActionText, { color: cc }]}>Grades</Text>
                    </TouchableOpacity>
                  </View>
                </MotiView>
              );
            }) : (
              <View style={styles.card}>
                <Text style={styles.emptyText}>No children linked to your account yet. Contact the school admin.</Text>
              </View>
            )}
          </MotiView>
        )}
      </ScrollView>

      <PremiumAlert
        isOpen={comingSoon}
        title={alertConfig.title}
        message={alertConfig.message}
        onCancel={() => setComingSoon(false)}
        type="info"
        confirmText="Got it"
        onConfirm={() => setComingSoon(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 40 },

  // Header
  headerGradient: {
    paddingBottom: 36,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 0.5 },
  headerName: { fontSize: 30, fontWeight: '900', color: '#fff', marginTop: 4, letterSpacing: -0.5 },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 24,
  },
  roleText: { fontSize: 11, fontWeight: '900', color: '#facc15', letterSpacing: 1.5 },
  logoutBtn: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, marginTop: -20, gap: 16,
    zIndex: 20,
  },
  metricCard: {
    width: '47%', backgroundColor: COLORS.surface, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900], shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 20,
    elevation: 4,
  },
  metricIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  metricLabel: { fontSize: 11, fontWeight: '800', color: COLORS.slate[500], textTransform: 'uppercase', letterSpacing: 1 },
  metricValue: { fontSize: 32, fontWeight: '900', color: COLORS.slate[900], marginTop: 4, letterSpacing: -1 },

  // Modules Grid
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  moduleIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  moduleCardText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate[800],
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  // Section
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.slate[900], letterSpacing: -0.5, paddingHorizontal: 24, marginTop: 32, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 },
  seeAll: { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  // Card
  card: {
    marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 24, padding: 8,
    borderWidth: 1, borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900], shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 16,
    elevation: 3,
  },

  // Events
  eventItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  eventItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.slate[100] },
  eventDateBox: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  eventDateText: { fontSize: 13, fontWeight: '900' },
  eventTitle: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900] },
  eventDesc: { fontSize: 13, color: COLORS.slate[500], fontWeight: '600', marginTop: 4 },
  emptyText: { textAlign: 'center', color: COLORS.slate[400], padding: 40, fontSize: 14, fontWeight: '700' },

  // Recent Students
  recentItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  recentName: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900] },
  recentSub: { fontSize: 13, color: COLORS.slate[500], fontWeight: '600', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Parent Children Cards
  childCard: {
    marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.surface, borderRadius: 24,
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16,
    borderWidth: 1, borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16,
    elevation: 4,
  },
  childAvatar: {
    width: 56, height: 56, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  childAvatarText: { fontSize: 20, fontWeight: '900' },
  childName: { fontSize: 17, fontWeight: '900', color: COLORS.slate[900] },
  childMeta: { fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 4 },
  childStatusBadge: {
    alignSelf: 'flex-start', marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  childStatusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  childActions: { alignItems: 'center' },
  childActionBtn: {
    alignItems: 'center', gap: 6, backgroundColor: COLORS.slate[50],
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16,
  },
  childActionText: { fontSize: 11, fontWeight: '800' },
});

export default DashboardScreen;
