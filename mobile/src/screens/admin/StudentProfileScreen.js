import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { studentAPI } from '../../api';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, Award, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const displayGrade = (g) => {
  if (!g) return '';
  const str = g.toString().trim();
  if (str.toUpperCase() === 'JHS 1') return 'Basic 7';
  if (str.toUpperCase() === 'JHS 2') return 'Basic 8';
  if (str.toUpperCase() === 'JHS 3') return 'Basic 9';
  return str.replace(/Primary|Basic/i, 'Basic');
};

const StudentProfileScreen = ({ route, navigation }) => {
  const { studentId, studentName } = route.params || {};
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // info, academic, attendance

  useEffect(() => {
    // In a real scenario, fetch by ID. We might need to handle if ID is not provided.
    // For now, we'll mock or fetch basic info if an ID exists.
    if (studentId) {
      fetchStudent();
    } else {
      setLoading(false); // Demo fallback
    }
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      const res = await studentAPI.getById(studentId);
      if (res.data?.success) {
        setStudent(res.data.data);
      }
    } catch (e) {
      console.log('Error fetching student profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase() || '?';

  // Demo data if API fails or no ID provided
  const data = student || {
    first_name: studentName?.split(' ')[0] || 'Unknown',
    last_name: studentName?.split(' ')[1] || 'Student',
    admission_number: 'STD-2026-001',
    class_name: 'Grade 10A',
    email: 'student@example.com',
    phone: '+233 54 123 4567',
    address: '123 University Campus',
    status: 'active'
  };

  const name = `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim();

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city) parts.push(addr.city);
    if (addr.region) parts.push(addr.region);
    if (addr.country) parts.push(addr.country);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Icon size={16} color={COLORS.slate[500]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

        {/* Profile Header */}
        <LinearGradient
          colors={['#00843e', '#006b32']}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={{ width: '100%' }}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ArrowLeft size={20} color="#fff" />
              </TouchableOpacity>
              <View style={[styles.statusBadge, { backgroundColor: data.status === 'active' ? '#10b981' : '#ef4444' }]}>
                <Text style={styles.statusText}>{data.status?.toUpperCase() || 'ACTIVE'}</Text>
              </View>
            </View>

            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(data.first_name || data.firstName, data.last_name || data.lastName)}</Text>
              </View>
            </View>

            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileSub}>{data.admission_number || data.student_id} • {displayGrade(data.class_name || data.grade)}</Text>
          </SafeAreaView>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['info', 'academic', 'attendance'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <MotiView
          key={activeTab}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.contentSection}
        >
          {activeTab === 'info' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              <View style={styles.cardContent}>
                <InfoRow icon={Mail} label="Email Address" value={data.email} />
                <View style={styles.divider} />
                <InfoRow icon={Phone} label="Phone Number" value={data.phone} />
                <View style={styles.divider} />
                <InfoRow icon={MapPin} label="Home Address" value={formatAddress(data.address)} />
                <View style={styles.divider} />
                <InfoRow icon={Calendar} label="Date of Birth" value={data.dob || data.date_of_birth} />
              </View>
            </View>
          )}

          {activeTab === 'academic' && (
            <View style={styles.card}>
              <View style={styles.emptyState}>
                <BookOpen size={40} color={COLORS.slate[200]} />
                <Text style={styles.emptyTitle}>Academic Records</Text>
                <Text style={styles.emptyText}>Grades and courses will appear here in Phase 2.</Text>
              </View>
            </View>
          )}

          {activeTab === 'attendance' && (
            <View style={styles.card}>
              <View style={styles.emptyState}>
                <CheckCircle size={40} color={COLORS.slate[200]} />
                <Text style={styles.emptyTitle}>Attendance Logs</Text>
                <Text style={styles.emptyText}>Detailed attendance tracking will be added in Phase 2.</Text>
              </View>
            </View>
          )}
        </MotiView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },

  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, width: '100%',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  avatarContainer: { marginTop: 10, marginBottom: 16, marginLeft: 20 },
  avatar: {
    width: 90, height: 90, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  profileName: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginLeft: 20 },
  profileSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 4, marginLeft: 20 },

  tabContainer: {
    flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, marginBottom: 16, gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center',
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '800', color: COLORS.slate[400] },
  tabTextActive: { color: '#fff' },

  contentSection: { paddingHorizontal: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900], marginBottom: 16 },
  cardContent: { gap: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, fontWeight: '700', color: COLORS.slate[400], marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.slate[800] },
  divider: { height: 1, backgroundColor: '#f1f5f9' },

  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.slate[800], marginTop: 16 },
  emptyText: { fontSize: 13, color: COLORS.slate[400], fontWeight: '500', marginTop: 8, textAlign: 'center' },
});

export default StudentProfileScreen;
