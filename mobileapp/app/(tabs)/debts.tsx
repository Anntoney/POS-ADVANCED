import { useState, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Customer } from '@/lib/types'
import { useTheme } from '@/lib/theme-context'
import { getDefaultCurrency, formatCurrency, Currency } from '@/lib/currency'

export default function DebtsScreen() {
  const { colors } = useTheme()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [totalDebt, setTotalDebt] = useState(0)
  const [currency, setCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    fetchCustomersWithDebt()
    loadCurrency()
  }, [])

  const loadCurrency = async () => {
    const curr = await getDefaultCurrency()
    setCurrency(curr)
  }

  const fetchCustomersWithDebt = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .gt('balance', 0)
        .order('balance', { ascending: false })

      if (error) throw error

      setCustomers(data || [])
      
      const total = (data || []).reduce((sum, customer) => sum + customer.balance, 0)
      setTotalDebt(total)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={[styles.customerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.customerHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, { color: colors.text }]}>{item.name}</Text>
          {item.phone && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>{item.phone}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>{item.email}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.debtContainer, { backgroundColor: colors.warning + '20' }]}>
        <Text style={[styles.debtLabel, { color: colors.textSecondary }]}>Outstanding Balance</Text>
        <Text style={[styles.debtAmount, { color: colors.error }]}>
          {currency ? formatCurrency(item.balance, currency) : `$${item.balance.toFixed(2)}`}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => Alert.alert('Customer Details', `View full details for ${item.name}`)}
      >
        <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Details</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.error }]}>
          <Ionicons name="wallet-outline" size={32} color="#fff" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Outstanding</Text>
            <Text style={styles.summaryValue}>
              {currency ? formatCurrency(totalDebt, currency) : `$${totalDebt.toFixed(2)}`}
            </Text>
            <Text style={styles.summaryCount}>{customers.length} customers</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchCustomersWithDebt}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No outstanding debts!</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              All customers have cleared their balances
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryContainer: {
    padding: 15,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryContent: {
    marginLeft: 15,
    flex: 1,
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
    opacity: 0.9,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryCount: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  listContainer: {
    padding: 15,
  },
  customerCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  customerHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  contactText: {
    fontSize: 13,
  },
  debtContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  debtLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  debtAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
})
