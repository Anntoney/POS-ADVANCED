import { useEffect, useState, useCallback } from 'react';
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
import { CalendarPicker } from '@/lib/components/CalendarPicker';
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
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [fromDatePickerValue, setFromDatePickerValue] = useState<Date>(new Date());
  const [toDatePickerValue, setToDatePickerValue] = useState<Date>(new Date());
  const [grossProfit, setGrossProfit] = useState<number>(0);
  const [calculatingGross, setCalculatingGross] = useState(false);

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
      setLoading(true);
      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedStoreId) {
        query = query.eq('store_id', selectedStoreId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const salesData = data || [];
      setAllSales(salesData);
      // Apply filters will be called by useEffect when allSales updates
    } catch (error) {
      console.error('Error loading sales:', error);
      setAllSales([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = useCallback((salesData: Sale[]) => {
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
  }, [fromDate, toDate]);

  useEffect(() => {
    loadStores();
    loadSales();
  }, []);

  useEffect(() => {
    // Reload sales when store selection changes
    if (stores.length > 0 || selectedStoreId === null) {
      setLoading(true);
      loadSales();
    }
  }, [selectedStoreId]);

  useEffect(() => {
    // Apply date filters when dates change or allSales updates
    applyFilters(allSales);
  }, [fromDate, toDate, allSales, applyFilters]);

  // Calculate gross profit (total sales - cost of goods sold)
  const calculateGrossProfit = useCallback(async () => {
    try {
      const saleIds = sales.map(s => s.id);
      if (saleIds.length === 0) return 0;

      // Get all sale items with product cost prices
      const { data: saleItems, error } = await supabase
        .from('sale_items')
        .select(`
          sale_id,
          quantity,
          unit_price,
          product_id,
          products:product_id (
            cost_price
          )
        `)
        .in('sale_id', saleIds);

      if (error) {
        console.error('Error fetching sale items:', error);
        return 0;
      }

      let totalCost = 0;
      let totalRevenue = 0;

      saleItems?.forEach((item: any) => {
        const costPrice = item.products?.cost_price || 0;
        const revenue = Number(item.unit_price || 0) * Number(item.quantity || 0);
        const cost = Number(costPrice) * Number(item.quantity || 0);
        totalCost += cost;
        totalRevenue += revenue;
      });

      return totalRevenue - totalCost;
    } catch (error) {
      console.error('Error calculating gross profit:', error);
      return 0;
    }
  }, [sales]);

  useEffect(() => {
    if (sales.length > 0) {
      setCalculatingGross(true);
      calculateGrossProfit().then(gross => {
        setGrossProfit(gross);
        setCalculatingGross(false);
      });
    } else {
      setGrossProfit(0);
    }
  }, [sales.length, calculateGrossProfit]);

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

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <>
      <Modal
        visible={loading || calculatingGross}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.loadingModal, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {calculatingGross ? 'Calculating profit...' : 'Loading sales...'}
            </Text>
          </View>
        </View>
      </Modal>
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
            {Platform.OS === 'web' ? (
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            ) : (
              <>
              <TouchableOpacity
                style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center' }]}
                onPress={() => {
                  if (fromDate) {
                    setFromDatePickerValue(new Date(fromDate + 'T00:00:00'));
                  } else {
                    setFromDatePickerValue(new Date());
                  }
                  setShowFromDatePicker(true);
                }}
              >
                <Text style={{ color: colors.text }}>
                  {fromDate || 'Tap to select'}
                </Text>
              </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>To:</Text>
            {Platform.OS === 'web' ? (
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            ) : (
              <>
              <TouchableOpacity
                style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center' }]}
                onPress={() => {
                  if (toDate) {
                    setToDatePickerValue(new Date(toDate + 'T00:00:00'));
                  } else {
                    setToDatePickerValue(new Date());
                  }
                  setShowToDatePicker(true);
                }}
              >
                <Text style={{ color: colors.text }}>
                  {toDate || 'Tap to select'}
                </Text>
              </TouchableOpacity>
              </>
            )}
          </View>
          
          {/* Date Picker Modals */}
          {Platform.OS !== 'web' && (
            <>
              <Modal
                visible={showFromDatePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFromDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>Select From Date</Text>
                      <TouchableOpacity onPress={() => setShowFromDatePicker(false)}>
                        <Text style={{ fontSize: 24, color: colors.text }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView>
                      <CalendarPicker
                        value={fromDatePickerValue}
                        onChange={(date) => {
                          setFromDatePickerValue(date);
                          setFromDate(date.toISOString().split('T')[0]);
                        }}
                        onClose={() => setShowFromDatePicker(false)}
                        colors={colors}
                      />
                    </ScrollView>
                  </View>
                </View>
              </Modal>
              
              <Modal
                visible={showToDatePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowToDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>Select To Date</Text>
                      <TouchableOpacity onPress={() => setShowToDatePicker(false)}>
                        <Text style={{ fontSize: 24, color: colors.text }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView>
                      <CalendarPicker
                        value={toDatePickerValue}
                        onChange={(date) => {
                          setToDatePickerValue(date);
                          setToDate(date.toISOString().split('T')[0]);
                        }}
                        onClose={() => setShowToDatePicker(false)}
                        colors={colors}
                      />
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </>
          )}
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
          Total Sales
          {selectedStore ? ` - ${selectedStore.name}` : ' - All Shops'}
          {fromDate || toDate ? ' (Filtered)' : ' (Last 50 Sales)'}
        </Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(totalRevenue, currency || undefined)}
        </Text>
        {!calculatingGross && (
          <>
            <Text style={[styles.summaryLabel, { marginTop: 12 }]}>
              Gross Profit
            </Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(grossProfit, currency || undefined)}
            </Text>
          </>
        )}
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
    </>
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
  datePickerContainer: {
    padding: 16,
  },
});
