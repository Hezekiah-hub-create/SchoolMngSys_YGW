import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { COLORS, commonStyles } from '../theme';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, BookOpen, Calendar, Clock } from 'lucide-react-native';
import { MotiView } from 'moti';

const DashboardScreen = () => {
  const { user, logout } = useAuth();

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <MotiView 
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[commonStyles.glassCard, styles.statCard]}
    >
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Icon color={color} size={24} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut color={COLORS.error} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            title="Courses" 
            value="6" 
            icon={BookOpen} 
            color={COLORS.primary} 
          />
          <StatCard 
            title="Attendance" 
            value="94%" 
            icon={Calendar} 
            color="#3b82f6" 
          />
        </View>

        <MotiView 
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 300 }}
          style={[commonStyles.glassCard, styles.mainCard]}
        >
          <View style={styles.mainCardHeader}>
            <Clock color={COLORS.primary} size={20} />
            <Text style={styles.mainCardTitle}>Today's Schedule</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleTime}>08:00 AM</Text>
            <View style={styles.scheduleDivider} />
            <View>
              <Text style={styles.scheduleSubject}>Mathematics</Text>
              <Text style={styles.scheduleRoom}>Room 102</Text>
            </View>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleTime}>10:30 AM</Text>
            <View style={styles.scheduleDivider} />
            <View>
              <Text style={styles.scheduleSubject}>Science</Text>
              <Text style={styles.scheduleRoom}>Lab A</Text>
            </View>
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.slate[600],
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.slate[900],
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  roleText: {
    color: COLORS.secondaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate[900],
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '700',
  },
  mainCard: {
    padding: 24,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  mainCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.slate[900],
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scheduleTime: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate[600],
    width: 70,
  },
  scheduleDivider: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 16,
    borderRadius: 1,
  },
  scheduleSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate[900],
  },
  scheduleRoom: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '600',
    marginTop: 2,
  },
});

export default DashboardScreen;
