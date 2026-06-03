import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { ArrowLeft, Search, Users, BookOpen } from 'lucide-react-native';
import { MotiView } from 'moti';
import { courseAPI } from '../../api';

const SubjectAllocationScreen = ({ navigation }) => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      // We use courseAPI here as Courses typically map Teachers -> Subjects -> Classes
      const res = await courseAPI.getAll();
      if (res.data?.success) {
        setAllocations(res.data.data || []);
      }
    } catch (e) {
      console.log('Allocations fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllocations();
    setRefreshing(false);
  }, []);

  const getTeacherName = (t) => {
    if (!t) return 'Unassigned';
    if (typeof t === 'string') return t;
    return `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Unassigned';
  };

  const getSubjectName = (s) => {
    if (!s) return 'Unknown Subject';
    if (typeof s === 'string') return s;
    return s.name || s.title || 'Unknown Subject';
  };

  const filteredAllocations = allocations.filter(a => {
    const teacherName = getTeacherName(a.teacher || a.teacher_name).toLowerCase();
    const subjectName = getSubjectName(a.subject || a.name || a.title).toLowerCase();
    return teacherName.includes(searchQuery.toLowerCase()) || subjectName.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.slate[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subject Allocation</Text>
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
        <Text style={styles.headerTitle}>Subject Allocation</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.slate[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by teacher or subject..."
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
          {filteredAllocations.length > 0 ? filteredAllocations.map((alloc, idx) => (
            <View key={alloc.id || idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Users size={24} color="#8b5cf6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{getTeacherName(alloc.teacher || alloc.teacher_name)}</Text>
                  <Text style={styles.cardSub}>Teacher</Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={16} color={COLORS.slate[400]} />
                  <Text style={styles.footerText}>{getSubjectName(alloc.subject || alloc.name || alloc.title)}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{alloc.level || alloc.grade || 'All Levels'}</Text>
                </View>
              </View>
            </View>
          )) : (
            <View style={styles.emptyContainer}>
              <Users size={48} color={COLORS.slate[200]} />
              <Text style={styles.emptyTitle}>No Allocations Found</Text>
              <Text style={styles.emptySub}>Assign subjects to teachers to see them here</Text>
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
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText: { fontSize: 14, fontWeight: '700', color: COLORS.slate[800] },
  badge: { backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.slate[600] },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900], marginTop: 16 },
  emptySub: { fontSize: 14, color: COLORS.slate[500], fontWeight: '500', marginTop: 8 },
});

export default SubjectAllocationScreen;
