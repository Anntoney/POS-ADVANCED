import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Profile, UserRole } from '@/lib/types';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { formatDate } from '@/lib/utils';
import { getCurrentUserProfile } from '@/lib/utils';

export default function UsersScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    const profile = await getCurrentUserProfile();
    setCurrentUser(profile);
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (u) =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) throw error;

      Alert.alert('Success', `User role updated to ${newRole}`);
      setRoleModalVisible(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleToggleActive = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', `User ${user.is_active ? 'deactivated' : 'activated'}`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling active status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return colors.error;
      case 'manager':
        return colors.warning;
      case 'cashier':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const renderUser = ({ item }: { item: Profile }) => {
    const roleColor = getRoleColor(item.role);
    const isCurrentUser = currentUser?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          if (!isCurrentUser) {
            setSelectedUser(item);
            setRoleModalVisible(true);
          }
        }}
      >
        <View style={styles.userHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={{ fontSize: 24 }}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.full_name || 'No Name'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
            <View style={styles.userMeta}>
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
                <Text style={[styles.roleText, { color: roleColor }]}>
                  {item.role.toUpperCase()}
                </Text>
              </View>
              {!item.is_active && (
                <View style={[styles.inactiveBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                  <Text style={[styles.inactiveText, { color: colors.textSecondary }]}>INACTIVE</Text>
                </View>
              )}
            </View>
          </View>
          {!isCurrentUser && (
            <TouchableOpacity
              onPress={() => handleToggleActive(item)}
              style={styles.toggleButton}
            >
              <Text style={{ fontSize: 24, color: item.is_active ? colors.success : colors.textSecondary }}>
                {item.is_active ? '✓' : '✕'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const stylesWithTheme = StyleSheet.create({
    ...styles,
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    searchInput: {
      ...styles.searchInput,
      backgroundColor: colors.surface,
      color: colors.text,
      borderColor: colors.border,
    },
    modalContent: {
      ...styles.modalContent,
      backgroundColor: colors.surface,
    },
    modalTitle: {
      ...styles.modalTitle,
      color: colors.text,
    },
    modalText: {
      ...styles.modalText,
      color: colors.text,
    },
  });

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={stylesWithTheme.container}>
      <View style={styles.searchContainer}>
        <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
        <TextInput
          style={stylesWithTheme.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64, color: colors.textSecondary }}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
          </View>
        }
      />

      {/* Role Change Modal */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={stylesWithTheme.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={stylesWithTheme.modalTitle}>Change User Role</Text>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <Text style={{ fontSize: 24, color: colors.text }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[stylesWithTheme.modalText, { marginBottom: 20 }]}>
              {selectedUser?.full_name || selectedUser?.email}
            </Text>

            <View style={styles.roleOptions}>
              {(['admin', 'manager', 'cashier'] as UserRole[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor:
                        selectedUser?.role === role ? colors.primary : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleRoleChange(role)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      {
                        color: selectedUser?.role === role ? '#fff' : colors.text,
                        fontWeight: selectedUser?.role === role ? '600' : '400',
                      },
                    ]}
                  >
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 20,
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingLeft: 40,
    paddingRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600',
  },
  toggleButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 14,
  },
  roleOptions: {
    gap: 12,
  },
  roleOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleOptionText: {
    fontSize: 16,
  },
});
