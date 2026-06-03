import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { ArrowLeft, Search, GraduationCap, Calendar } from 'lucide-react-native';
import { MotiView } from 'moti';
import { examAPI } from '../../api';
import moment from 'moment';

const ExamsScreen = ({ navigation }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await examAPI.getAll();
      if (res.data?.success) {
        setExams(res.data.data || []);
      }
    } catch (e) {
      console.log('Exams fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExams();
    setRefreshing(false);
  }, []);

  const filteredExams = exams.filter(e => 
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.class?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.slate[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exams & Results</Text>
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
        <Text style={styles.headerTitle}>Exams & Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.slate[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exams or classes..."
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
          {filteredExams.length > 0 ? filteredExams.map((exam, idx) => (
            <View key={exam.id || idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <GraduationCap size={24} color="#8b5cf6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{exam.name || 'End of Term Exam'}</Text>
                  <Text style={styles.cardSub}>Class: {exam.class || 'All Levels'}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{exam.term || '1st Term'}</Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} color={COLORS.slate[400]} />
                  <Text style={styles.footerText}>
                    {exam.date ? moment(exam.date).format('MMM Do YYYY') : 'Date TBD'}
                  </Text>
                </View>
                <Text style={styles.yearText}>{exam.academic_year || '2024/2025'}</Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyContainer}>
              <GraduationCap size={48} color={COLORS.slate[200]} />
              <Text style={styles.emptyTitle}>No Exams Scheduled</Text>
              <Text style={styles.emptySub}>Check back later for updates</Text>
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
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.slate[900] },
  cardSub: { fontSize: 13, color: COLORS.slate[500], fontWeight: '600', marginTop: 2 },
  badge: { backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.slate[600] },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText: { fontSize: 13, fontWeight: '600', color: COLORS.slate[600] },
  yearText: { fontSize: 13, fontWeight: '700', color: '#8b5cf6' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900], marginTop: 16 },
  emptySub: { fontSize: 14, color: COLORS.slate[500], fontWeight: '500', marginTop: 8 },
});

export default ExamsScreen;
