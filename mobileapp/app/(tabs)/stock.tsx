import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';

export default function StockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('stock_quantity', { ascending: true });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading stock:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const getFilteredProducts = () => {
    if (filter === 'low') {
      return products.filter((p) => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0);
    }
    if (filter === 'out') {
      return products.filter((p) => p.stock_quantity === 0);
    }
    return products;
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return { label: 'Out of Stock', color: '#FF3B30', icon: 'close-circle' };
    }
    if (product.stock_quantity <= product.min_stock_level) {
      return { label: 'Low Stock', color: '#FF9500', icon: 'warning' };
    }
    return { label: 'In Stock', color: '#34C759', icon: 'checkmark-circle' };
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const status = getStockStatus(item);
    const stockPercentage = item.min_stock_level > 0
      ? (item.stock_quantity / (item.min_stock_level * 3)) * 100
      : 100;

    return (
      <TouchableOpacity style={styles.stockCard}>
        <View style={styles.stockHeader}>
          <View style={styles.stockInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            {item.sku && (
              <Text style={styles.productSku}>SKU: {item.sku}</Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${status.color}20` },
            ]}
          >
            <Ionicons name={status.icon as any} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.stockDetails}>
          <View style={styles.stockBarContainer}>
            <View style={styles.stockBarBackground}>
              <View
                style={[
                  styles.stockBarFill,
                  {
                    width: `${Math.min(stockPercentage, 100)}%`,
                    backgroundColor: status.color,
                  },
                ]}
              />
            </View>
          </View>
          <View style={styles.stockNumbers}>
            <View style={styles.stockNumberItem}>
              <Text style={styles.stockNumberLabel}>Current</Text>
              <Text style={styles.stockNumberValue}>{item.stock_quantity}</Text>
            </View>
            <View style={styles.stockNumberItem}>
              <Text style={styles.stockNumberLabel}>Min Level</Text>
              <Text style={styles.stockNumberValue}>
                {item.min_stock_level}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'low' && styles.filterButtonActive]}
          onPress={() => setFilter('low')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'low' && styles.filterTextActive,
            ]}
          >
            Low Stock
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'out' && styles.filterButtonActive]}
          onPress={() => setFilter('out')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'out' && styles.filterTextActive,
            ]}
          >
            Out of Stock
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  stockCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockDetails: {
    marginTop: 8,
  },
  stockBarContainer: {
    marginBottom: 12,
  },
  stockBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  stockNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stockNumberItem: {
    alignItems: 'center',
  },
  stockNumberLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  stockNumberValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
