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
    (f.class || f.grade || '').toLowerCase().includes(searchQuery.toLowerCase())
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
                  <Text style={styles.cardSub}>Class: {fee.class || fee.grade || 'All Levels'}</Text>
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
  iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.slate[900] },
  cardSub: { fontSize: 13, color: COLORS.slate[500], fontWeight: '600', marginTop: 2 },
  badge: { backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 14, fontWeight: '900', color: '#10b981' },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText: { fontSize: 13, fontWeight: '600', color: COLORS.slate[600] },
  yearText: { fontSize: 13, fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900], marginTop: 16 },
  emptySub: { fontSize: 14, color: COLORS.slate[500], fontWeight: '500', marginTop: 8 },
});

export default FeesScreen;
