import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import {
  Users, GraduationCap, User,
  BookOpen, Library, CheckSquare, Clock,
  FileText, TrendingUp, Grid, Calendar,
  CreditCard, DollarSign, PieChart, AlertCircle,
  Settings, Bell, Activity, ArrowLeft
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumAlert from '../../components/PremiumAlert';

const ADMIN_MODULES = [
  {
    category: 'User Management',
    items: [
      { id: 'students', name: 'Students', icon: Users, color: '#00843e', route: 'AdminStudentsList' },
      { id: 'teachers', name: 'Teachers', icon: GraduationCap, color: '#3b82f6', route: 'AdminTeachersList' },
      { id: 'parents', name: 'Parents', icon: Users, color: '#8b5cf6', route: 'AdminParentsList' },
      { id: 'staff', name: 'Staff', icon: User, color: '#f59e0b', route: 'AdminStaffList' },
    ]
  },
  {
    category: 'Academic & Exams',
    items: [
      { id: 'classes', name: 'Classes', icon: Grid, color: '#06b6d4' },
      { id: 'courses', name: 'Courses', icon: BookOpen, color: '#ec4899' },
      { id: 'attendance', name: 'Attendance', icon: CheckSquare, color: '#10b981' },
      { id: 'timetable', name: 'Timetable', icon: Clock, color: '#6366f1' },
      { id: 'exams', name: 'Exams & Results', icon: TrendingUp, color: '#ef4444' },
    ]
  },
  {
    category: 'Finance & Reports',
    items: [
      { id: 'fees', name: 'Fees Collection', icon: CreditCard, color: '#14b8a6' },
      { id: 'expenses', name: 'Expenses', icon: DollarSign, color: '#f43f5e' },
      { id: 'reports', name: 'Generate Reports', icon: PieChart, color: '#8b5cf6' },
    ]
  },
  {
    category: 'System',
    items: [
      { id: 'calendar', name: 'Academic Calendar', icon: Calendar, color: '#f59e0b', route: 'Calendar' },
      { id: 'announcements', name: 'Announcements', icon: Bell, color: '#3b82f6' },
      { id: 'logs', name: 'Activity Logs', icon: Activity, color: '#64748b' },
      { id: 'settings', name: 'System Settings', icon: Settings, color: '#334155' },
    ]
  }
];

const AdminHubScreen = ({ navigation }) => {
  const [comingSoon, setComingSoon] = useState(false);

  const handlePress = (route) => {
    if (route) {
      navigation.navigate(route);
    } else {
      setComingSoon(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.slate[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Hub</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient
          colors={['#00843e', '#006b32']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerDecor} />
          <Text style={styles.bannerTitle}>Workspace</Text>
          <Text style={styles.bannerSub}>Manage all school operations from here.</Text>
        </LinearGradient>

        {/* Modules Grid */}
        {ADMIN_MODULES.map((section, sIdx) => (
          <MotiView
            key={section.category}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: sIdx * 100 }}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>{section.category}</Text>
            <View style={styles.grid}>
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridItem}
                    activeOpacity={0.7}
                    onPress={() => handlePress(item.route)}
                  >
                    <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                      <Icon size={24} color={item.color} />
                    </View>
                    <Text style={styles.itemText} numberOfLines={2}>{item.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </MotiView>
        ))}
      </ScrollView>

      <PremiumAlert
        isOpen={comingSoon}
        type="info"
        title="Coming Soon"
        message="This module is being built and will be available in a future update."
        onConfirm={() => setComingSoon(false)}
        confirmText="Got it"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900] },
  scrollContent: { paddingBottom: 40 },
  banner: {
    marginHorizontal: 20, marginTop: 10, marginBottom: 24, padding: 24,
    borderRadius: 20, position: 'relative', overflow: 'hidden',
  },
  bannerDecor: {
    position: 'absolute', right: -20, top: -20, width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14, fontWeight: '800', color: COLORS.slate[400],
    paddingHorizontal: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12,
  },
  gridItem: {
    width: '30%', // roughly 3 per row
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  itemText: { fontSize: 12, fontWeight: '700', color: COLORS.slate[700], textAlign: 'center' },
});

export default AdminHubScreen;
