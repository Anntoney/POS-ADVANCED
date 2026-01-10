import { Tabs } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { isAdmin, getUserPermissions } from '@/lib/utils';

export default function TabLayout() {
  const { colors } = useTheme();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const admin = await isAdmin(user.id);
          setIsUserAdmin(admin);

          if (admin) {
            // Admins have access to everything
            const allPermissions: Record<string, boolean> = {
              dashboard: true,
              products: true,
              stock: true,
              sales: true,
              customers: true,
              credit: true,
              settings: true,
            };
            setPermissions(allPermissions);
          } else {
            const userPerms = await getUserPermissions(user.id);
            setPermissions(userPerms);
          }
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  // Check if tab should be shown based on permissions
  const shouldShowTab = (feature: string): boolean => {
    if (isUserAdmin) return true;
    return permissions[feature] === true;
  };

  if (loading) {
    return null; // Or a loading indicator
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 16 }}
          >
            <Text style={{ fontSize: 24, color: colors.primary }}>🚪</Text>
          </TouchableOpacity>
        ),
      }}
    >
      {shouldShowTab('dashboard') && (
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>🏠</Text>
            ),
          }}
        />
      )}
      {shouldShowTab('products') && (
        <Tabs.Screen
          name="products"
          options={{
            title: 'Products',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>📦</Text>
            ),
          }}
        />
      )}
      {shouldShowTab('stock') && (
        <Tabs.Screen
          name="stock"
          options={{
            title: 'Stock',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>📊</Text>
            ),
          }}
        />
      )}
      {(shouldShowTab('pos') || shouldShowTab('sales')) && (
        <Tabs.Screen
          name="sales"
          options={{
            title: 'Sales',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>🛒</Text>
            ),
          }}
        />
      )}
      {shouldShowTab('credit') && (
        <Tabs.Screen
          name="credits"
          options={{
            title: 'Credits',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>🧾</Text>
            ),
          }}
        />
      )}
      {isUserAdmin && (
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>👥</Text>
            ),
          }}
        />
      )}
      {shouldShowTab('settings') && (
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>⚙️</Text>
            ),
          }}
        />
      )}
    </Tabs>
  );
}
