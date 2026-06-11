import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { ArrowLeft, Search, Banknote, CreditCard } from 'lucide-react-native';
import { MotiView } from 'moti';
import { feeAPI } from '../../api';

const displayGrade = (g) => {
  if (!g) return '';
  const str = g.toString().trim();
  if (str.toUpperCase() === 'JHS 1') return 'Basic 7';
  if (str.toUpperCase() === 'JHS 2') return 'Basic 8';
  if (str.toUpperCase() === 'JHS 3') return 'Basic 9';
  return str.replace(/Primary|Basic/i, 'Basic');
};

const FeesScreen = ({ navigation }) => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await feeAPI.getAll();
      if (res.data?.success) {
        setFees(res.data.data || []);
      }
    } catch (e) {
      console.log('Fees fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFees();
    setRefreshing(false);
  }, []);

  const filteredFees = fees.filter(f => 
    (f.title || f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (displayGrade(f.class || f.grade) || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.slate[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fees & Finance</Text>
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
        <Text style={styles.headerTitle}>Fees & Finance</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.slate[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search fee structures..."
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
          {filteredFees.length > 0 ? filteredFees.map((fee, idx) => (
            <View key={fee.id || idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Banknote size={24} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{fee.title || fee.name || 'General Tuition'}</Text>
                  <Text style={styles.cardSub}>Class: {displayGrade(fee.class || fee.grade) || 'All Levels'}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>GH₵{fee.amount || fee.total_amount || 0}</Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={16} color={COLORS.slate[400]} />
                  <Text style={styles.footerText}>{fee.term || '1st Term'} - {fee.academic_year || 'Current Year'}</Text>
                </View>
                {fee.status && (
                  <Text style={[styles.yearText, { color: fee.status === 'Active' ? '#10b981' : COLORS.slate[400] }]}>
                    {fee.status}
                  </Text>
                )}
              </View>
            </View>
          )) : (
            <View style={styles.emptyContainer}>
              <Banknote size={48} color={COLORS.slate[200]} />
              <Text style={styles.emptyTitle}>No Fee Records</Text>
              <Text style={styles.emptySub}>Fee structures will appear here</Text>
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
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: `${COLORS.success}15`, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '900', color: COLORS.slate[900], letterSpacing: -0.3 },
  cardSub: { fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 4 },
  badge: { backgroundColor: `${COLORS.success}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 14, fontWeight: '900', color: COLORS.success },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.slate[100] },
  footerText: { fontSize: 14, fontWeight: '700', color: COLORS.slate[600] },
  yearText: { fontSize: 14, fontWeight: '800' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.slate[900], marginTop: 20, letterSpacing: -0.5 },
  emptySub: { fontSize: 15, color: COLORS.slate[500], fontWeight: '600', marginTop: 8 },
});

export default FeesScreen;
