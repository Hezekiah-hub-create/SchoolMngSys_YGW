import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { ArrowLeft, Search, Layers, Grid } from 'lucide-react-native';
import { MotiView } from 'moti';
import { sectionAPI } from '../../api';

const SectionsScreen = ({ navigation }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await sectionAPI.getAll();
      if (res.data?.success) {
        setSections(res.data.data || []);
      }
    } catch (e) {
      console.log('Sections fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSections();
    setRefreshing(false);
  }, []);

  const filteredSections = sections.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (typeof s.class === 'string' ? s.class : s.class?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.slate[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sections</Text>
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
        <Text style={styles.headerTitle}>Sections</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.slate[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sections or classes..."
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
          {filteredSections.length > 0 ? filteredSections.map((sec, idx) => (
            <View key={sec.id || idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Layers size={24} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Section {sec.name}</Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <Grid size={16} color={COLORS.slate[400]} />
                <Text style={styles.footerText}>Class: {sec.class_name || 'N/A'}</Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyContainer}>
              <Layers size={48} color={COLORS.slate[200]} />
              <Text style={styles.emptyTitle}>No Sections Found</Text>
              <Text style={styles.emptySub}>Try adjusting your search</Text>
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
  iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.slate[900] },
  cardSub: { fontSize: 13, color: COLORS.slate[500], fontWeight: '600', marginTop: 2 },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText: { fontSize: 13, fontWeight: '600', color: COLORS.slate[600] },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900], marginTop: 16 },
  emptySub: { fontSize: 14, color: COLORS.slate[500], fontWeight: '500', marginTop: 8 },
});

export default SectionsScreen;
