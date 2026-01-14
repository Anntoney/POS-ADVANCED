import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { formatCurrency } from '@/lib/utils';
import { router } from 'expo-router';

export default function ProductsScreen() {
  const { currency } = useCurrency();
  const { colors } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [canAccessAllStores, setCanAccessAllStores] = useState(false);
  const [userStoreId, setUserStoreId] = useState<string | null>(null);

  const loadUserContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, store_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        const admin = profile.role === 'admin';
        const storeId = profile.store_id || null;
        const canAccessAll = admin && !storeId;
        
        setCanAccessAllStores(canAccessAll);
        setUserStoreId(storeId);
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const loadProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      // For admins without a store, show all products
      // For non-admins or admins with a store, filter by their store
      if (!canAccessAllStores && userStoreId) {
        query = query.eq('store_id', userStoreId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      // Set empty arrays on error to prevent infinite loading
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadUserContext();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (userStoreId !== null || canAccessAllStores) {
      loadProducts();
    }
  }, [canAccessAllStores, userStoreId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.stock_quantity <= item.min_stock_level;

    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.surface }]}
        onPress={() => {
          // Navigate to product detail/edit screen
          // router.push(`/products/${item.id}`);
        }}
      >
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
            {item.sku && (
              <Text style={[styles.productSku, { color: colors.textSecondary }]}>SKU: {item.sku}</Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.is_active ? colors.success + '20' : colors.error + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.is_active ? colors.success : colors.error },
              ]}
            >
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Price:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatCurrency(item.selling_price, currency || undefined)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Stock:</Text>
            <View style={styles.stockContainer}>
              <Text
                style={[
                  styles.detailValue,
                  { color: colors.text },
                  isLowStock && { color: colors.error },
                ]}
              >
                {item.stock_quantity}
              </Text>
              {isLowStock && (
                <Text style={[styles.warningIcon, { color: colors.error }]}>⚠️</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ fontSize: 20, color: colors.textSecondary }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64, color: colors.textSecondary }}>📦</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found</Text>
          </View>
        }
      />
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
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  productCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 16,
    marginLeft: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModal: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});
