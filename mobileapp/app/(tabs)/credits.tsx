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
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Customer, CustomerPayment, Sale } from '@/lib/types';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import * as Linking from 'expo-linking';

export default function CreditsScreen() {
  const { currency } = useCurrency();
  const { colors } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .gt('balance', 0)
        .order('balance', { ascending: false });

      if (error) throw error;

      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const loadCustomerDetails = async (customer: Customer) => {
    try {
      const [salesResult, paymentsResult] = await Promise.all([
        supabase
          .from('sales')
          .select('*')
          .eq('customer_id', customer.id)
          .in('payment_status', ['credit', 'partial'])
          .order('created_at', { ascending: false }),
        supabase
          .from('customer_payments')
          .select('*')
          .eq('customer_id', customer.id)
          .order('payment_date', { ascending: false }),
      ]);

      if (salesResult.error) throw salesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setCustomerSales(salesResult.data || []);
      setCustomerPayments(paymentsResult.data || []);
      setSelectedCustomer(customer);
      setDetailModalVisible(true);
    } catch (error) {
      console.error('Error loading customer details:', error);
      Alert.alert('Error', 'Failed to load customer details');
    }
  };

  const generateInvoiceText = (): string => {
    if (!selectedCustomer || !currency) return '';

    const creditSales = customerSales.filter(
      (s) => s.payment_status === 'credit' || s.payment_status === 'partial'
    );
    const totalCredit = creditSales.reduce(
      (sum, s) => sum + Number(s.total_amount) - Number(s.amount_paid || 0),
      0
    );
    const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    let invoice = `CREDIT INVOICE\n`;
    invoice += `Customer: ${selectedCustomer.name}\n`;
    if (selectedCustomer.phone) invoice += `Phone: ${selectedCustomer.phone}\n`;
    if (selectedCustomer.email) invoice += `Email: ${selectedCustomer.email}\n`;
    invoice += `Date: ${new Date().toLocaleDateString()}\n\n`;
    invoice += `CREDIT SALES:\n`;
    creditSales.forEach((sale) => {
      invoice += `- Sale #${sale.id.slice(0, 8)}: ${formatCurrency(Number(sale.total_amount), currency)}\n`;
    });
    invoice += `\nPAYMENT HISTORY:\n`;
    customerPayments.forEach((payment) => {
      invoice += `- ${formatDate(payment.payment_date)}: ${formatCurrency(Number(payment.amount), currency || undefined)} (${payment.payment_method})\n`;
    });
    invoice += `\nTotal Credit: ${formatCurrency(totalCredit, currency || undefined)}\n`;
    invoice += `Total Paid: ${formatCurrency(totalPaid, currency || undefined)}\n`;
    invoice += `OUTSTANDING BALANCE: ${formatCurrency(Number(selectedCustomer.balance), currency || undefined)}\n`;

    return invoice;
  };

  const shareViaWhatsApp = () => {
    const invoiceText = generateInvoiceText();
    const phone = selectedCustomer?.phone?.replace(/[^0-9]/g, '');
    
    if (!phone) {
      Alert.alert('Error', 'Customer phone number is not available');
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(invoiceText)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp');
    });
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={[styles.customerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => loadCustomerDetails(item)}
    >
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, { color: colors.text }]}>{item.name}</Text>
          {item.phone && (
            <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>
              {item.phone}
            </Text>
          )}
        </View>
        <View style={[styles.balanceBadge, { backgroundColor: colors.error + '20' }]}>
          <Text style={[styles.balanceText, { color: colors.error }]}>
            {formatCurrency(Number(item.balance), currency || undefined)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    modalTextSecondary: {
      ...styles.modalTextSecondary,
      color: colors.textSecondary,
    },
  });

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalOutstanding = customers.reduce((sum, c) => sum + Number(c.balance), 0);

  return (
    <View style={stylesWithTheme.container}>
      <View style={[styles.summaryCard, { backgroundColor: colors.error }]}>
        <Text style={styles.summaryLabel}>Total Outstanding</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(totalOutstanding, currency || undefined)}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
        <TextInput
          style={stylesWithTheme.searchInput}
          placeholder="Search customers..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64, color: colors.textSecondary }}>🧾</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No customers with outstanding credits
            </Text>
          </View>
        }
      />

      {/* Customer Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={[stylesWithTheme.modalContent, { flex: 1 }]}>
          <View style={styles.modalHeader}>
            <Text style={stylesWithTheme.modalTitle}>
              {selectedCustomer?.name} - Credit Details
            </Text>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <Text style={{ fontSize: 24, color: colors.text }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Credit Sales</Text>
              {customerSales.map((sale) => (
                <View key={sale.id} style={[styles.detailItem, { borderColor: colors.border }]}>
                  <Text style={[stylesWithTheme.modalText, { fontWeight: '600' }]}>
                    Sale #{sale.id.slice(0, 8)}
                  </Text>
                  <Text style={stylesWithTheme.modalTextSecondary}>
                    {formatDate(sale.created_at)}
                  </Text>
                  <Text style={[stylesWithTheme.modalText, { color: colors.error }]}>
                    {formatCurrency(Number(sale.total_amount), currency || undefined)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment History</Text>
              {customerPayments.map((payment) => (
                <View key={payment.id} style={[styles.detailItem, { borderColor: colors.border }]}>
                  <Text style={[stylesWithTheme.modalText, { fontWeight: '600' }]}>
                    {formatDate(payment.payment_date)}
                  </Text>
                  <Text style={stylesWithTheme.modalTextSecondary}>
                    {payment.payment_method} - {payment.payment_number}
                  </Text>
                  <Text style={[stylesWithTheme.modalText, { color: colors.success }]}>
                    {formatCurrency(Number(payment.amount), currency || undefined)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={[styles.balanceSection, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.balanceLabel, { color: colors.error }]}>
                Outstanding Balance
              </Text>
              <Text style={[styles.balanceAmount, { color: colors.error }]}>
                {formatCurrency(Number(selectedCustomer?.balance || 0), currency || undefined)}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setDetailModalVisible(false);
                setInvoiceModalVisible(true);
              }}
            >
              <Text style={{ fontSize: 20, color: '#fff', marginRight: 8 }}>📄</Text>
              <Text style={styles.actionButtonText}>Generate Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        visible={invoiceModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInvoiceModalVisible(false)}
      >
        <View style={[stylesWithTheme.modalContent, { flex: 1 }]}>
          <View style={styles.modalHeader}>
            <Text style={stylesWithTheme.modalTitle}>Credit Invoice</Text>
            <TouchableOpacity onPress={() => setInvoiceModalVisible(false)}>
              <Text style={{ fontSize: 24, color: colors.text }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <Text style={[styles.invoiceText, { color: colors.text }]}>
              {generateInvoiceText()}
            </Text>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={shareViaWhatsApp}
            >
              <Text style={{ fontSize: 20, color: '#fff', marginRight: 8 }}>💬</Text>
              <Text style={styles.actionButtonText}>Share via WhatsApp</Text>
            </TouchableOpacity>
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
  summaryCard: {
    margin: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
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
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
  },
  balanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScrollView: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalText: {
    fontSize: 14,
  },
  modalTextSecondary: {
    fontSize: 12,
  },
  balanceSection: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalActions: {
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  invoiceText: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
});
