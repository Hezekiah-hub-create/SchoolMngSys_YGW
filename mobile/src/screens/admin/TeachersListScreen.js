import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { teacherAPI } from '../../api';
import { Search, Filter, ChevronRight, ArrowLeft, GraduationCap } from 'lucide-react-native';
import { MotiView } from 'moti';

const TeachersListScreen = ({ navigation }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await teacherAPI.getAll({ limit: 500 });
      if (res.data?.success) {
        setTeachers(res.data.data);
      }
    } catch (e) {
      console.log('Error fetching teachers:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const name = `${t.first_name || t.firstName || ''} ${t.last_name || t.lastName || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const getInitials = (f, l) => {
    return `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase() || '?';
  };

  const renderTeacher = ({ item, index }) => {
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
          onPress={() => alert(`View Profile: ${name}`)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.first_name || item.firstName, item.last_name || item.lastName)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.subText}>Dept: {item.department || 'N/A'} • Exp: {item.experience || 0} yrs</Text>
          </View>
          <ChevronRight size={20} color={COLORS.slate[300]} />
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.slate[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teachers</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={18} color={COLORS.slate[700]} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.slate[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teachers by name..."
            placeholderTextColor={COLORS.slate[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={'#3b82f6'} />
        </View>
      ) : (
        <FlatList
          data={filteredTeachers}
          keyExtractor={(item) => (item.id || Math.random()).toString()}
          renderItem={renderTeacher}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <GraduationCap size={48} color={COLORS.slate[200]} />
              <Text style={styles.emptyText}>No teachers found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  filterBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900] },
  
  searchContainer: { paddingHorizontal: 20, paddingBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, height: 50,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500', color: COLORS.slate[900] },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.slate[900] },
  subText: { fontSize: 12, color: COLORS.slate[400], fontWeight: '500', marginTop: 4 },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 15, color: COLORS.slate[400], fontWeight: '600' }
});

export default TeachersListScreen;
