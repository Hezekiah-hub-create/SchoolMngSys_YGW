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
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: `${COLORS.purple}15`, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '900', color: COLORS.slate[900], letterSpacing: -0.3 },
  cardSub: { fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 4 },
  badge: { backgroundColor: COLORS.slate[50], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '900', color: COLORS.slate[700] },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.slate[100] },
  footerText: { fontSize: 14, fontWeight: '700', color: COLORS.slate[600] },
  yearText: { fontSize: 14, fontWeight: '800', color: COLORS.purple },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.slate[900], marginTop: 20, letterSpacing: -0.5 },
  emptySub: { fontSize: 15, color: COLORS.slate[500], fontWeight: '600', marginTop: 8 },
});

export default ExamsScreen;
