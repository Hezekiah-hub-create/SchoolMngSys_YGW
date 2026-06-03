import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { ArrowLeft, Settings as SettingsIcon, Bell, Moon, Shield, Save } from 'lucide-react-native';
import { MotiView } from 'moti';
import { settingsAPI } from '../../api';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.getSettings();
      if (res.data?.success) {
        setSettings(res.data.data);
      }
    } catch (e) {
      console.log('Settings fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSettings();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.slate[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.slate[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <TouchableOpacity style={styles.saveBtn}>
          <Save size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          {/* Academic Settings */}
          <Text style={styles.sectionTitle}>Academic Configuration</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Current Academic Year</Text>
                <Text style={styles.settingValue}>{settings?.current_session || '2024/2025'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Current Term</Text>
                <Text style={styles.settingValue}>{settings?.current_term || '1st Term'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>School Name</Text>
                <Text style={styles.settingValue}>{settings?.school_name || 'Standard International School'}</Text>
              </View>
            </View>
          </View>

          {/* App Preferences */}
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Bell size={20} color="#3b82f6" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingSub}>Receive updates and alerts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
                thumbColor={notificationsEnabled ? '#3b82f6' : '#f8fafc'}
              />
            </View>
            <View style={styles.divider} />
            <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={[styles.settingIconBox, { backgroundColor: '#f3e8ff' }]}>
                <Moon size={20} color="#a855f7" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingSub}>Coming in next update</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#e2e8f0', true: '#e9d5ff' }}
                thumbColor={darkMode ? '#a855f7' : '#f8fafc'}
                disabled
              />
            </View>
          </View>

          {/* Security */}
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={[styles.settingIconBox, { backgroundColor: '#fee2e2' }]}>
                <Shield size={20} color="#ef4444" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Change Password</Text>
                <Text style={styles.settingSub}>Update your login credentials</Text>
              </View>
              <ArrowLeft size={20} color={COLORS.slate[400]} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>

        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  saveBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.slate[900] },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.slate[900], marginBottom: 12, marginLeft: 4, marginTop: 10 },
  
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 },
  
  settingIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '700', color: COLORS.slate[900] },
  settingSub: { fontSize: 13, color: COLORS.slate[500], fontWeight: '500', marginTop: 2 },
  settingValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
});

export default SettingsScreen;
