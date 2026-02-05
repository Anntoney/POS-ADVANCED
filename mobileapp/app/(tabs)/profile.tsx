import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-context'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
}

export default function ProfileScreen() {
  const { colors, theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      }
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = () => {
    Alert.alert(
      'Choose Theme',
      'Select your preferred theme',
      [
        { text: 'Light', onPress: () => setTheme('light') },
        { text: 'Dark', onPress: () => setTheme('dark') },
        { text: 'System', onPress: () => setTheme('system') },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light'
      case 'dark': return 'Dark'
      case 'system': return 'System'
      default: return 'System'
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="person" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || 'Admin User'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{profile?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.roleText}>{profile?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.card }]} 
          onPress={handleThemeChange}
        >
          <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
          <View style={styles.actionContent}>
            <Text style={[styles.actionText, { color: colors.text }]}>Theme</Text>
            <Text style={[styles.actionSubtext, { color: colors.textSecondary }]}>{getThemeLabel()}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>App Information</Text>
        
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Connected</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
          <Ionicons name="refresh-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>Sync Data</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
          <Ionicons name="settings-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
          <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={[styles.footer, { color: colors.textSecondary }]}>Admin Mobile App v1.0.0</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    marginBottom: 10,
  },
  roleBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoCard: {
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionContent: {
    marginLeft: 15,
    flex: 1,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  actionSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    margin: 15,
    marginTop: 30,
    gap: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 30,
  },
})
