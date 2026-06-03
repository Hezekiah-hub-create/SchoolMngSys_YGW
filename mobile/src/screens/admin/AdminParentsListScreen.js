import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator,
  RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { ArrowLeft, Search, Users, Phone, Mail, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import { parentAPI } from '../../api';

const AdminParentsListScreen = ({ navigation }) => {
  const [parents, setParents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await parentAPI.getAll({ limit: 500 });
      const data = res?.data?.data || [];
      setParents(data);
      setFiltered(data);
    } catch (e) {
      console.error('Parents fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(parents);
      return;
    }
    const q = text.toLowerCase();
    setFiltered(parents.filter(p =>
      `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q)
    ));
  };

  const getInitials = (p) => {
    const fn = p.firstName || p.first_name || '';
    const ln = p.lastName || p.last_name || '';
    return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || '?';
  };

  const COLORS_LIST = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  const getColor = (idx) => COLORS_LIST[idx % COLORS_LIST.length];

  const renderItem = ({ item, index }) => {
    const name = `${item.firstName || item.first_name || ''} ${item.lastName || item.last_name || ''}`.trim();
    const color = getColor(index);
    const childCount = (item.studentIds || item.student_ids || []).length;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: Math.min(index * 30, 300) }}
        renderToHardwareTextureAndroid={true}
        needsOffscreenAlphaCompositing={true}
        style={styles.card}
      >
        <View style={[styles.avatar, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.avatarText, { color }]}>{getInitials(item)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{name || 'Unknown'}</Text>
          <Text style={styles.meta} numberOfLines={1}>{item.relationship || 'Parent'}</Text>
          {item.email ? (
            <View style={styles.infoRow}>
              <Mail size={11} color={COLORS.slate[400]} />
              <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
            </View>
          ) : null}
          {item.phone ? (
            <View style={styles.infoRow}>
              <Phone size={11} color={COLORS.slate[400]} />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.childBadge, { backgroundColor: `${color}12` }]}>
          <Users size={12} color={color} />
          <Text style={[styles.childBadgeText, { color }]}>{childCount}</Text>
        </View>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.slate[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parents</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.slate[400]} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search parents..."
          placeholderTextColor={COLORS.slate[400]}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <X size={16} color={COLORS.slate[400]} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={52} color={COLORS.slate[200]} />
          <Text style={styles.emptyTitle}>{search ? 'No Results' : 'No Parents Yet'}</Text>
          <Text style={styles.emptyText}>{search ? `No parents match "${search}"` : 'Parents will appear here once enrolled.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => item.id || String(idx)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.slate[100],
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.slate[900] },
  countBadge: {
    minWidth: 36, height: 28, borderRadius: 10,
    backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10,
  },
  countText: { fontSize: 13, fontWeight: '900', color: COLORS.primary },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, paddingHorizontal: 16, height: 48,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.slate[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.slate[900], fontWeight: '600' },

  // Card
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900' },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900] },
  meta: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  infoText: { fontSize: 11, color: COLORS.slate[500], fontWeight: '600' },
  childBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  childBadgeText: { fontSize: 13, fontWeight: '900' },

  // States
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: COLORS.slate[800], marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 8, textAlign: 'center' },
});

export default AdminParentsListScreen;
