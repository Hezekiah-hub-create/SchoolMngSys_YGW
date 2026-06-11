import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Check, X, Clock, Save, Users } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { studentAPI, attendanceAPI } from '../../api';
import PremiumAlert from '../../components/PremiumAlert';

const displayGrade = (g) => {
  if (!g) return '';
  const str = g.toString().trim();
  if (str.toUpperCase() === 'JHS 1') return 'Basic 7';
  if (str.toUpperCase() === 'JHS 2') return 'Basic 8';
  if (str.toUpperCase() === 'JHS 3') return 'Basic 9';
  return str.replace(/Primary|Basic/i, 'Basic');
};

const TeacherAttendanceScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({}); // { studentId: 'present' | 'absent' | 'late' }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'info', title: '', message: '', onConfirm: null });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch assigned students for the teacher
      const studRes = await studentAPI.getAll({ limit: 'none' });
      const fetchedStudents = studRes?.data?.data || [];
      
      // Initialize default attendance state to 'present'
      const defaultState = {};
      fetchedStudents.forEach(s => {
        defaultState[s.id] = 'present';
      });
      
      // Check if attendance already recorded today
      try {
        const attRes = await attendanceAPI.getAll({ date: today, limit: 1000 });
        const existingAtt = attRes?.data?.data || [];
        existingAtt.forEach(att => {
          if (defaultState[att.student_id]) {
            defaultState[att.student_id] = att.status;
          }
        });
      } catch (attError) {
        console.log('No existing attendance for today or fetch failed');
      }

      setStudents(fetchedStudents);
      setAttendanceState(defaultState);
    } catch (e) {
      console.error('Fetch students error:', e);
      setAlert({ open: true, type: 'error', title: 'Error', message: 'Failed to load students. Please try again.', onConfirm: () => setAlert(a => ({ ...a, open: false })) });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const markStatus = (studentId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const submitAttendance = async () => {
    if (students.length === 0) {
      setAlert({ open: true, type: 'info', title: 'No Students', message: 'No students to record attendance for.', onConfirm: () => setAlert(a => ({ ...a, open: false })) });
      return;
    }

    try {
      setSubmitting(true);
      const records = students.map(s => ({
        student_id: s.id,
        date: today,
        status: attendanceState[s.id],
        period: 'General'
      }));

      const res = await attendanceAPI.bulkRecord({ records });
      if (res.data?.success) {
        setAlert({
          open: true, type: 'success', title: 'Attendance Saved!',
          message: 'Attendance has been recorded successfully.',
          onConfirm: () => { setAlert(a => ({ ...a, open: false })); navigation.goBack(); }
        });
      } else {
        throw new Error(res.data?.message || 'Failed to submit');
      }
    } catch (e) {
      console.error('Submit attendance error:', e);
      setAlert({ open: true, type: 'error', title: 'Submit Failed', message: e.response?.data?.message || e.message || 'Failed to submit attendance.', onConfirm: () => setAlert(a => ({ ...a, open: false })) });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.slate[900]} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Take Attendance</Text>
          <Text style={styles.headerSubtitle}>{new Date().toDateString()}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.saveBtn, submitting && styles.saveBtnDisabled]} 
          onPress={submitAttendance}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save color="#fff" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{students.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Present</Text>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>
            {Object.values(attendanceState).filter(s => s === 'present').length}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Absent</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {Object.values(attendanceState).filter(s => s === 'absent').length}
          </Text>
        </View>
      </View>

      {/* Student List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {students.length > 0 ? students.map((student, idx) => {
          const name = `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`.trim();
          const currentStatus = attendanceState[student.id];

          return (
            <MotiView 
              key={student.id} 
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: idx * 50 }}
              style={styles.studentCard}
            >
              <View style={styles.studentInfo}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{getInitials(name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.studentMeta}>
                    {student.admissionNumber || student.admission_number || 'N/A'} • {displayGrade(student.grade) || 'No Grade'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.statusBtn, currentStatus === 'present' && styles.statusBtnPresent]}
                  onPress={() => markStatus(student.id, 'present')}
                >
                  <Check color={currentStatus === 'present' ? '#fff' : COLORS.primary} size={16} />
                  <Text style={[styles.statusBtnText, currentStatus === 'present' && styles.statusBtnTextActive]}>P</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.statusBtn, currentStatus === 'absent' && styles.statusBtnAbsent]}
                  onPress={() => markStatus(student.id, 'absent')}
                >
                  <X color={currentStatus === 'absent' ? '#fff' : '#ef4444'} size={16} />
                  <Text style={[styles.statusBtnText, { color: '#ef4444' }, currentStatus === 'absent' && styles.statusBtnTextActive]}>A</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.statusBtn, currentStatus === 'late' && styles.statusBtnLate]}
                  onPress={() => markStatus(student.id, 'late')}
                >
                  <Clock color={currentStatus === 'late' ? '#fff' : '#f59e0b'} size={16} />
                  <Text style={[styles.statusBtnText, { color: '#f59e0b' }, currentStatus === 'late' && styles.statusBtnTextActive]}>L</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          );
        }) : (
          <View style={styles.emptyState}>
            <Users size={48} color={COLORS.slate[300]} />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyText}>You don't have any students assigned to your classes yet.</Text>
          </View>
        )}
      </ScrollView>

      <PremiumAlert
        isOpen={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

  // Header
  header: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: COLORS.slate[100]
  },
  backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.slate[900], letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: COLORS.slate[500], fontWeight: '600', marginTop: 2 },
  saveBtn: { 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Stats
  statsContainer: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 20, marginTop: 20, marginBottom: 10,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    justifyContent: 'space-around'
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: COLORS.slate[400], fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '900', color: COLORS.slate[900] },

  // Student Card
  studentCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8,
  },
  studentInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#f0f9ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  avatarText: { color: '#0ea5e9', fontWeight: '900', fontSize: 15 },
  studentName: { fontSize: 16, fontWeight: '800', color: COLORS.slate[900] },
  studentMeta: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600', marginTop: 2 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 10 },
  statusBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  statusBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  statusBtnTextActive: { color: '#fff' },
  statusBtnPresent: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusBtnAbsent: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  statusBtnLate: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },

  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[800], marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }
});

export default TeacherAttendanceScreen;
