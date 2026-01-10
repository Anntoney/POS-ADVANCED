import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Sale, Store } from '@/lib/types';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SalesScreen() {
  const { currency } = useCurrency();
  const { colors } = useTheme();
  const [sales, setSales] = useState<Sale[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadSales = async () => {
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStoreId) {
        query = query.eq('store_id', selectedStoreId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAllSales(data || []);
      applyFilters(data || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (salesData: Sale[]) => {
    let filtered = [...salesData];

    // Filter by date range
    if (fromDate || toDate) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.created_at);
        const from = fromDate ? new Date(fromDate + 'T00:00:00') : null;
        const to = toDate ? new Date(toDate + 'T23:59:59') : null;

        if (from && saleDate < from) return false;
        if (to && saleDate > to) return false;
        return true;
      });
    }

    // Limit to 50 for display
    filtered = filtered.slice(0, 50);
    setSales(filtered);
  };

  useEffect(() => {
    loadStores();
    loadSales();
  }, []);

  useEffect(() => {
    if (stores.length > 0) {
      loadSales();
    }
  }, [selectedStoreId]);

  useEffect(() => {
    if (allSales.length > 0) {
      applyFilters(allSales);
    }
  }, [fromDate, toDate, allSales.length]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSales();
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'partial':
        return colors.warning;
      case 'pending':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'mobile_money':
        return '📱';
      case 'bank_transfer':
        return '🏦';
      case 'credit':
        return '💳';
      default:
        return '💰';
    }
  };

  const clearDateFilters = () => {
    setFromDate('');
    setToDate('');
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDateInputProps = () => {
    if (Platform.OS === 'ios') {
      return {
        type: 'date' as const,
      };
    }
    return {};
  };

  const renderSale = ({ item }: { item: Sale }) => {
    const statusColor = getPaymentStatusColor(item.payment_status);
    const methodIcon = getPaymentMethodIcon(item.payment_method);

    return (
      <TouchableOpacity style={[styles.saleCard, { backgroundColor: colors.surface }]}>
        <View style={styles.saleHeader}>
          <View style={styles.saleInfo}>
            <Text style={[styles.saleId, { color: colors.text }]}>Sale #{item.id.slice(0, 8)}</Text>
            <Text style={[styles.saleDate, { color: colors.textSecondary }]}>{formatDate(item.created_at)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.payment_status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.saleDetails}>
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Total Amount</Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>
              {formatCurrency(item.total_amount, currency || undefined)}
            </Text>
          </View>

          <View style={styles.paymentInfo}>
            <View style={styles.paymentMethod}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>{methodIcon}</Text>
              <Text style={[styles.paymentMethodText, { color: colors.textSecondary }]}>
                {item.payment_method.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            {item.discount_amount > 0 && (
              <Text style={[styles.discountText, { color: colors.success }]}>
                Discount: {formatCurrency(item.discount_amount, currency || undefined)}
              </Text>
            )}
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

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setStoreModalVisible(true)}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>🏪</Text>
          <Text style={[styles.filterButtonText, { color: colors.text }]}>
            {selectedStore ? selectedStore.name : 'All Shops'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            ...((fromDate || toDate) ? [{ borderColor: colors.primary, borderWidth: 2 }] : []),
          ]}
          onPress={() => setShowDateFilter(!showDateFilter)}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>📅</Text>
          <Text style={[styles.filterButtonText, { color: colors.text }]}>
            {(fromDate || toDate) ? 'Filtered' : 'Dates'}
          </Text>
          {(fromDate || toDate) && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                clearDateFilters();
              }}
              style={styles.clearButton}
            >
              <Text style={{ fontSize: 16, color: colors.error }}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {showDateFilter && (
        <View style={[styles.dateFilterContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>From:</Text>
            <TextInput
              style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={fromDate}
              onChangeText={setFromDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              {...(Platform.OS === 'web' && { type: 'date' })}
            />
          </View>
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>To:</Text>
            <TextInput
              style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={toDate}
              onChangeText={setToDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              {...(Platform.OS === 'web' && { type: 'date' })}
            />
          </View>
          <View style={styles.dateActionRow}>
            <TouchableOpacity
              style={[styles.dateActionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const today = getTodayDate();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                setFromDate(sevenDaysAgo.toISOString().split('T')[0]);
                setToDate(today);
              }}
            >
              <Text style={styles.dateActionText}>Last 7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateActionButton, { backgroundColor: colors.warning }]}
              onPress={() => {
                const today = getTodayDate();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
                setToDate(today);
              }}
            >
              <Text style={styles.dateActionText}>Last 30 Days</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.summaryLabel}>
          Total Revenue
          {fromDate || toDate ? ' (Filtered)' : ' (Last 50 Sales)'}
        </Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(totalRevenue, currency || undefined)}
        </Text>
        <Text style={styles.summaryCount}>
          {sales.length} sale{sales.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🛒</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sales found</Text>
          </View>
        }
      />

      {/* Store Selection Modal */}
      <Modal
        visible={storeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStoreModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Shop</Text>
              <TouchableOpacity onPress={() => setStoreModalVisible(false)}>
                <Text style={{ fontSize: 24, color: colors.text }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[
                  styles.storeOption,
                  {
                    backgroundColor: selectedStoreId === null ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedStoreId(null);
                  setStoreModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.storeOptionText,
                    {
                      color: selectedStoreId === null ? '#fff' : colors.text,
                      fontWeight: selectedStoreId === null ? '600' : '400',
                    },
                  ]}
                >
                  All Shops
                </Text>
              </TouchableOpacity>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    styles.storeOption,
                    {
                      backgroundColor: selectedStoreId === store.id ? colors.primary : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedStoreId(store.id);
                    setStoreModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.storeOptionText,
                      {
                        color: selectedStoreId === store.id ? '#fff' : colors.text,
                        fontWeight: selectedStoreId === store.id ? '600' : '400',
                      },
                    ]}
                  >
                    {store.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  filterRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  dateFilterContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 60,
    marginRight: 12,
  },
  dateInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  dateActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dateActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCount: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  saleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  saleDate: {
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
  saleDetails: {
    marginTop: 8,
  },
  amountContainer: {
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
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
  storeOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  storeOptionText: {
    fontSize: 16,
  },
});
