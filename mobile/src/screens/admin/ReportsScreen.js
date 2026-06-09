import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { ArrowLeft, Search, FileText, Download } from 'lucide-react-native';
import { MotiView } from 'moti';
import { reportAPI } from '../../api';

const ReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getPublishedReports();
      if (res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch (e) {
      console.log('Reports fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, []);

  const filteredReports = reports.filter(r => 
    (r.title || r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.slate[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Academic Reports</Text>
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
        <Text style={styles.headerTitle}>Academic Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.slate[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
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
          {filteredReports.length > 0 ? filteredReports.map((report, idx) => (
            <View key={report.id || idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <FileText size={24} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{report.title || report.name || 'End of Term Report'}</Text>
                  <Text style={styles.cardSub}>Type: {report.type || 'Terminal'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: report.status === 'Published' ? '#ecfdf5' : '#eff6ff' }]}>
                  <Text style={[styles.badgeText, { color: report.status === 'Published' ? '#10b981' : '#3b82f6' }]}>
                    {report.status || 'Published'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>{report.academic_year || '2024/2025'} - {report.term || '1st Term'}</Text>
                <TouchableOpacity style={styles.downloadBtn}>
                  <Download size={14} color={COLORS.primary} />
                  <Text style={styles.downloadText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          )) : (
            <View style={styles.emptyContainer}>
              <FileText size={48} color={COLORS.slate[200]} />
              <Text style={styles.emptyTitle}>No Published Reports</Text>
              <Text style={styles.emptySub}>Reports will appear here once generated</Text>
            </View>
          )}
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.slate[100],
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    zIndex: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.slate[50],
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.slate[200],
  },
  headerTitle: { fontSize: 19, fontWeight: '900', color: COLORS.slate[900], letterSpacing: -0.5 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 20,
    paddingHorizontal: 20, height: 56,
    marginHorizontal: 24, marginTop: 24,
    borderWidth: 1.5, borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 14, fontSize: 16, color: COLORS.slate[900], fontWeight: '600' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  
  card: {
    backgroundColor: COLORS.surface, borderRadius: 24, padding: 24, marginBottom: 20,
    borderWidth: 1.5, borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: `${COLORS.info}15`, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '900', color: COLORS.slate[900], letterSpacing: -0.3 },
  cardSub: { fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '900' },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.slate[100] },
  footerText: { fontSize: 14, fontWeight: '600', color: COLORS.slate[600] },
  
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${COLORS.primary}10`, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  downloadText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.slate[900], marginTop: 20, letterSpacing: -0.5 },
  emptySub: { fontSize: 15, color: COLORS.slate[500], fontWeight: '600', marginTop: 8 },
});

export default ReportsScreen;
