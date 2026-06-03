import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { ArrowLeft, Search, User, Mail, Phone, Briefcase, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import { staffAPI } from '../../api';

const AdminStaffListScreen = ({ navigation }) => {
  const [staff, setStaff] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await staffAPI.getAll({ limit: 500 });
      const data = res?.data?.data || [];
      setStaff(data);
      setFiltered(data);
    } catch (e) {
      console.error('Staff fetch error:', e);
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
      setFiltered(staff);
      return;
    }
    const q = text.toLowerCase();
    setFiltered(staff.filter(s =>
      `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.role || s.position || s.department || '').toLowerCase().includes(q)
    ));
  };

  const getInitials = (s) => {
    const fn = s.firstName || s.first_name || '';
    const ln = s.lastName || s.last_name || '';
    return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || '?';
  };

  const STAFF_COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#ef4444', '#3b82f6'];
  const getColor = (idx) => STAFF_COLORS[idx % STAFF_COLORS.length];

  const renderItem = ({ item, index }) => {
    const name = `${item.firstName || item.first_name || ''} ${item.lastName || item.last_name || ''}`.trim();
    const color = getColor(index);
    const role = item.role || item.position || item.department || 'Staff';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: Math.min(index * 40, 400) }}
        renderToHardwareTextureAndroid={true}
        needsOffscreenAlphaCompositing={true}
        style={styles.card}
      >
        <View style={[styles.avatar, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.avatarText, { color }]}>{getInitials(item)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{name || 'Unknown Staff'}</Text>
          <View style={styles.roleBadge}>
            <Briefcase size={11} color={color} />
            <Text style={[styles.roleText, { color }]}>{role}</Text>
          </View>
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
        <View style={[styles.statusDot, {
          backgroundColor: item.status === 'active' ? '#10b981' : '#94a3b8'
        }]} />
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
        <Text style={styles.headerTitle}>Staff</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.slate[400]} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff..."
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
          <User size={52} color={COLORS.slate[200]} />
          <Text style={styles.emptyTitle}>{search ? 'No Results' : 'No Staff Yet'}</Text>
          <Text style={styles.emptyText}>{search ? `No staff match "${search}"` : 'Staff will appear here once added.'}</Text>
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
    backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10,
  },
  countText: { fontSize: 13, fontWeight: '900', color: '#f59e0b' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, paddingHorizontal: 16, height: 48,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.slate[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.slate[900], fontWeight: '600' },

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
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 2 },
  roleText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  infoText: { fontSize: 11, color: COLORS.slate[500], fontWeight: '600' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: COLORS.slate[800], marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 8, textAlign: 'center' },
});

export default AdminStaffListScreen;
