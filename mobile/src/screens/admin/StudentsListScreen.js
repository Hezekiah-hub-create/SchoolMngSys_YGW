import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { studentAPI } from '../../api';
import { Search, ChevronRight, ArrowLeft, Users, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import PremiumSelect from '../../components/PremiumSelect';

const displayGrade = (g) => {
  if (!g) return '';
  const str = g.toString().trim();
  if (str.toUpperCase() === 'JHS 1') return 'Basic 7';
  if (str.toUpperCase() === 'JHS 2') return 'Basic 8';
  if (str.toUpperCase() === 'JHS 3') return 'Basic 9';
  return str.replace(/Primary|Basic/i, 'Basic');
};

const StudentsListScreen = ({ navigation }) => {
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState(null); // null = "All"

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentAPI.getAll({ limit: 500 });
      if (res.data?.success) setStudents(res.data.data);
    } catch (e) {
      console.log('Error fetching students:', e);
    } finally {
      setLoading(false);
    }
  };

  // Build unique sorted class list from the student data
  const classOptions = [
    { value: null, label: 'All Classes' },
    ...[...new Set(
      students
        .map(s => s.class_name || s.grade || null)
        .filter(Boolean)
    )]
    .sort()
    .map(cls => ({ value: cls, label: displayGrade(cls) }))
  ];

  const filteredStudents = students.filter(s => {
    const name = `${s.first_name || s.firstName || ''} ${s.last_name || s.lastName || ''}`.toLowerCase();
    const matchSearch = name.includes(searchQuery.toLowerCase());
    const cls = s.class_name || s.grade || null;
    const matchClass = !selectedClass || cls === selectedClass;
    return matchSearch && matchClass;
  });

  const getInitials = (f, l) =>
    `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase() || '?';

  const renderStudent = ({ item, index }) => {
    const name = `${item.first_name || item.firstName || ''} ${item.last_name || item.lastName || ''}`.trim();
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: Math.min(index * 40, 400) }}
        renderToHardwareTextureAndroid={true}
        needsOffscreenAlphaCompositing={true}
        style={{ backgroundColor: 'transparent' }}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AdminStudentProfile', { studentId: item.id, studentName: name })}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(item.first_name || item.firstName, item.last_name || item.lastName)}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.subText}>
              ID: {item.admissionNumber || item.admission_number || item.student_id || 'N/A'} • {displayGrade(item.class_name || item.grade) || 'No Class'}
            </Text>
          </View>
          <View style={[
            styles.statusDot,
            { backgroundColor: item.status === 'active' ? '#10b981' : '#94a3b8' }
          ]} />
          <ChevronRight size={18} color={COLORS.slate[300]} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.slate[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Students</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filteredStudents.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.slate[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor={COLORS.slate[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color={COLORS.slate[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Class Dropdown Filter */}
      <View style={styles.filterRow}>
        <View style={{ flex: 1 }}>
          <PremiumSelect
            value={selectedClass}
            onChange={setSelectedClass}
            options={classOptions}
            placeholder="Filter by Class"
            searchable={classOptions.length > 8}
          />
        </View>
        {selectedClass && (
          <TouchableOpacity
            style={styles.clearFilter}
            onPress={() => setSelectedClass(null)}
          >
            <X size={14} color={COLORS.primary} />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => (item.id || Math.random()).toString()}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Users size={52} color={COLORS.slate[200]} />
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedClass ? 'No Results' : 'No Students Yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery || selectedClass
                  ? 'Try adjusting your search or class filter.'
                  : 'Students will appear here once enrolled.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },

  // Header
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
  topBar: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 48,
    borderWidth: 1.5, borderColor: COLORS.slate[100], gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.slate[900] },

  // Class filter
  filterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  clearFilter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#ecfdf5', borderRadius: 12,
  },
  clearFilterText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },

  // Cards
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  avatar: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900] },
  subText: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600', marginTop: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 2 },

  // States
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: COLORS.slate[800], marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 8, textAlign: 'center' },
});

export default StudentsListScreen;
