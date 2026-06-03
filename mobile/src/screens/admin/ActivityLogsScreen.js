import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { ArrowLeft, Search, Activity, User, Clock } from 'lucide-react-native';
import { MotiView } from 'moti';
import { auditAPI } from '../../api';
import moment from 'moment';

const ActivityLogsScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditAPI.getAll({ limit: 50 }); // Fetch recent 50
      if (res.data?.success) {
        setLogs(res.data.data || []);
      }
    } catch (e) {
      console.log('Logs fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, []);

  const filteredLogs = logs.filter(l => 
    (l.action || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.entity_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.slate[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Logs</Text>
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
        <Text style={styles.headerTitle}>Activity Logs</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.slate[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search actions or users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.slate[400]}
        />
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
          {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
            <View key={log.id || idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: log.action === 'DELETE' ? '#fee2e2' : log.action === 'CREATE' ? '#ecfdf5' : '#eff6ff' }]}>
                  <Activity size={20} color={log.action === 'DELETE' ? '#ef4444' : log.action === 'CREATE' ? '#10b981' : '#3b82f6'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{log.action || 'System Action'}</Text>
                  <Text style={styles.cardSub}>Entity: {log.entity_type || 'System'}</Text>
                </View>
                <Text style={styles.timeText}>{moment(log.created_at).fromNow()}</Text>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <User size={14} color={COLORS.slate[400]} />
                  <Text style={styles.footerText}>{log.user_name || 'System User'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} color={COLORS.slate[400]} />
                  <Text style={styles.footerDate}>{moment(log.created_at).format('MMM D, h:mm A')}</Text>
                </View>
              </View>
            </View>
          )) : (
            <View style={styles.emptyContainer}>
              <Activity size={48} color={COLORS.slate[200]} />
              <Text style={styles.emptyTitle}>No Activity Logs</Text>
              <Text style={styles.emptySub}>System events will be recorded here</Text>
            </View>
          )}
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
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.slate[900] },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 16, height: 50,
    marginHorizontal: 20, marginTop: 20,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: COLORS.slate[800], fontWeight: '500' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900] },
  cardSub: { fontSize: 13, color: COLORS.slate[500], fontWeight: '600', marginTop: 2 },
  timeText: { fontSize: 12, fontWeight: '700', color: COLORS.slate[400] },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText: { fontSize: 13, fontWeight: '600', color: COLORS.slate[600] },
  footerDate: { fontSize: 12, fontWeight: '600', color: COLORS.slate[500] },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900], marginTop: 16 },
  emptySub: { fontSize: 14, color: COLORS.slate[500], fontWeight: '500', marginTop: 8 },
});

export default ActivityLogsScreen;
