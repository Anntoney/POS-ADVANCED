import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-context'

export default function Index() {
  const { colors } = useTheme()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      router.replace('/(tabs)')
    } else {
      router.replace('/(auth)/login')
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
