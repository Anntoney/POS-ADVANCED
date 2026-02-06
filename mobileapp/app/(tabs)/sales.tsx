import { useState, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Sale } from '@/lib/types'
import { format, startOfDay, endOfDay } from 'date-fns'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from '@/lib/theme-context'
import { getDefaultCurrency, formatCurrency, Currency } from '@/lib/currency'

export default function SalesScreen() {
  const { colors } = useTheme()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [totalSales, setTotalSales] = useState(0)
  const [totalGross, setTotalGross] = useState(0)
  const [currency, setCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    fetchSales()
    loadCurrency()
  }, [startDate, endDate])

  const loadCurrency = async () => {
    const curr = await getDefaultCurrency()
    setCurrency(curr)
  }

  const fetchSales = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(name)
        `)
        .gte('sale_date', startOfDay(startDate).toISOString())
        .lte('sale_date', endOfDay(endDate).toISOString())
        .order('sale_date', { ascending: false })

      if (error) throw error

      setSales(data || [])
      
      const total = (data || []).reduce((sum, sale) => sum + sale.total_amount, 0)
      setTotalSales(total)

      // Calculate total gross profit
      if (data && data.length > 0) {
        const saleIds = data.map(s => s.id)
        const { data: saleItems, error: itemsError } = await supabase
          .from('sale_items')
          .select(`
            quantity,
            unit_price,
            product:products(cost_price)
          `)
          .in('sale_id', saleIds)

        if (!itemsError && saleItems) {
          const grossProfit = saleItems.reduce((sum, item: any) => {
            const profit = (item.unit_price - (item.product?.cost_price || 0)) * item.quantity
            return sum + profit
          }, 0)
          setTotalGross(grossProfit)
        }
      } else {
        setTotalGross(0)
      }
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderSale = ({ item }: { item: Sale }) => (
    <View style={[styles.saleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.saleHeader}>
        <Text style={[styles.saleNumber, { color: colors.text }]}>{item.sale_number}</Text>
        <Text style={[
          styles.statusBadge,
          item.payment_status === 'paid' && styles.paidBadge,
          item.payment_status === 'partial' && styles.partialBadge,
          item.payment_status === 'pending' && styles.pendingBadge,
        ]}>
          {item.payment_status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.saleInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {format(new Date(item.sale_date), 'MMM dd, yyyy HH:mm')}
          </Text>
        </View>

        {item.customer && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{item.customer.name}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="card-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {item.payment_method.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Total:</Text>
        <Text style={[styles.amountValue, { color: colors.primary }]}>
          {currency ? formatCurrency(item.total_amount, currency) : `$${item.total_amount.toFixed(2)}`}
        </Text>
      </View>

      {item.payment_status !== 'paid' && (
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Balance:</Text>
          <Text style={[styles.balanceValue, { color: colors.error }]}>
            {currency ? formatCurrency(item.total_amount - item.amount_paid, currency) : `$${(item.total_amount - item.amount_paid).toFixed(2)}`}
          </Text>
        </View>
      )}
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.filterContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.inputBackground }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {format(startDate, 'MMM dd, yyyy')}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>to</Text>

          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.inputBackground }]}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {format(endDate, 'MMM dd, yyyy')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={styles.summaryValue}>
            {currency ? formatCurrency(totalSales, currency) : `$${totalSales.toFixed(2)}`}
          </Text>
          <Text style={styles.summaryLabel}>Total Gross Profit</Text>
          <Text style={styles.summaryValue}>
            {currency ? formatCurrency(totalGross, currency) : `$${totalGross.toFixed(2)}`}
          </Text>
          <Text style={styles.summaryCount}>{sales.length} transactions</Text>
        </View>
      </View>

      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchSales}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sales found</Text>
          </View>
        }
      />

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false)
            if (date) setStartDate(date)
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false)
            if (date) setEndDate(date)
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: 15,
    borderBottomWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
  },
  dateSeparator: {
    marginHorizontal: 10,
  },
  summaryCard: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 32,
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
  saleCard: {
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
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  paidBadge: {
    backgroundColor: '#4CAF50',
  },
  partialBadge: {
    backgroundColor: '#FF9800',
  },
  pendingBadge: {
    backgroundColor: '#FF5252',
  },
  saleInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
  },
})
