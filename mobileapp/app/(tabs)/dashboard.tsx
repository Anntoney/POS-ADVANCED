import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  totalSales: number;
  lowStockItems: number;
}

export default function DashboardScreen() {
  const { currency } = useCurrency();
  const { colors } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      // Get total revenue
      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount');

      const totalRevenue = sales?.reduce(
        (sum, sale) => sum + Number(sale.total_amount || 0),
        0
      ) || 0;

      // Get counts
      const [
        { count: productsCount },
        { count: customersCount },
        { count: salesCount },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('*', { count: 'exact', head: true }),
      ]);

      // Get low stock items
      const { data: products } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_level');

      const lowStockItems =
        products?.filter(
          (p) => p.stock_quantity <= p.min_stock_level
        ).length || 0;

      setStats({
        totalRevenue,
        totalProducts: productsCount || 0,
        totalCustomers: customersCount || 0,
        totalSales: salesCount || 0,
        lowStockItems,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.content}>
        <Text style={[styles.header, { color: colors.text }]}>Overview</Text>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue, currency || undefined)}
            icon="💰"
            color={colors.success}
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon="📦"
            color={colors.primary}
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon="👥"
            color={colors.warning}
          />
          <StatCard
            title="Total Sales"
            value={stats.totalSales}
            icon="🛒"
            color="#AF52DE"
          />
        </View>

        {stats.lowStockItems > 0 && (
          <View style={[styles.alertCard, { backgroundColor: colors.warning + '20', borderLeftColor: colors.warning }]}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>⚠️</Text>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>Low Stock Alert</Text>
              <Text style={[styles.alertText, { color: colors.textSecondary }]}>
                {stats.lowStockItems} product{stats.lowStockItems > 1 ? 's' : ''}{' '}
                need restocking
              </Text>
            </View>
          </View>
        )}
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
  content: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
  },
});
