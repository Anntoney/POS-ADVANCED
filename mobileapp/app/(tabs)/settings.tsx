import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { getCurrentUserProfile } from '@/lib/utils';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { colors, theme, themeMode, setThemeMode } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightComponent,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={[styles.settingIconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && (
        <Text style={{ fontSize: 20, color: colors.textSecondary }}>›</Text>
      ))}
    </TouchableOpacity>
  );

  const handleThemeChange = () => {
    const modes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto';
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
          <Text style={{ fontSize: 48 }}>👤</Text>
        </View>
        <Text style={[styles.profileName, { color: colors.text }]}>
          {profile?.full_name || 'Admin User'}
        </Text>
        <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.roleText}>{profile?.role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        <SettingItem
          icon={theme === 'dark' ? '🌙' : '☀️'}
          title="Theme"
          subtitle={`Current: ${getThemeLabel()}`}
          onPress={handleThemeChange}
          showArrow={false}
          rightComponent={
            <Text style={[styles.themeLabel, { color: colors.primary }]}>{getThemeLabel()}</Text>
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Management</Text>
        <SettingItem
          icon="🏪"
          title="Store Management"
          subtitle="Manage stores and locations"
          onPress={() => {
            Alert.alert('Coming Soon', 'Store management screen will be available soon');
          }}
        />
        <SettingItem
          icon="📊"
          title="Reports"
          subtitle="View detailed reports"
          onPress={() => {
            Alert.alert('Coming Soon', 'Reports screen will be available soon');
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>System</Text>
        <SettingItem
          icon="ℹ️"
          title="About"
          subtitle="App version 1.0.0"
          onPress={() => {
            Alert.alert(
              'POS Admin Mobile',
              'Version 1.0.0\n\nAdmin mobile application for POS system management.'
            );
          }}
        />
        <SettingItem
          icon="🚪"
          title="Logout"
          subtitle="Sign out from your account"
          onPress={handleLogout}
          showArrow={false}
        />
      </View>
    </ScrollView>
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
