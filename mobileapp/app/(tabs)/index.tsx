import { useState, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { useTheme } from '@/lib/theme-context'
import { getDefaultCurrency, formatCurrency, Currency } from '@/lib/currency'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function StockScreen() {
  const { colors } = useTheme()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add')
  const [quantity, setQuantity] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [reason, setReason] = useState('')
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [showTotals, setShowTotals] = useState(true)

  useEffect(() => {
    fetchProducts()
    loadCurrency()
    loadShowTotalsPreference()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchQuery, products])

  const loadCurrency = async () => {
    const curr = await getDefaultCurrency()
    setCurrency(curr)
  }

  const loadShowTotalsPreference = async () => {
    try {
      const value = await AsyncStorage.getItem('showStockTotals')
      if (value !== null) {
        setShowTotals(value === 'true')
      }
    } catch (error) {
      console.error('Failed to load preference:', error)
    }
  }

  const toggleShowTotals = async () => {
    const newValue = !showTotals
    setShowTotals(newValue)
    try {
      await AsyncStorage.setItem('showStockTotals', newValue.toString())
    } catch (error) {
      console.error('Failed to save preference:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const openAdjustModal = (product: Product, type: 'add' | 'deduct') => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setQuantity('')
    setReason('')
    setNewPrice('')
    setModalVisible(true)
  }

  const openPriceModal = (product: Product) => {
    setSelectedProduct(product)
    setNewPrice(product.selling_price.toString())
    setQuantity('')
    setModalVisible(true)
  }

  const handleStockAdjustment = async () => {
    if (!selectedProduct || !quantity) {
      Alert.alert('Error', 'Please enter quantity')
      return
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error: adjError } = await supabase
        .from('stock_adjustments')
        .insert({
          product_id: selectedProduct.id,
          adjustment_type: adjustmentType === 'add' ? 'addition' : 'subtraction',
          quantity: qty,
          reason: reason || `Manual ${adjustmentType === 'add' ? 'addition' : 'deduction'} via mobile app`,
          created_by: user?.id,
        })

      if (adjError) throw adjError

      const newStock = adjustmentType === 'add' 
        ? selectedProduct.stock_quantity + qty
        : selectedProduct.stock_quantity - qty

      if (newStock < 0) {
        Alert.alert('Error', 'Cannot deduct more than available stock')
        return
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', selectedProduct.id)

      if (updateError) throw updateError

      Alert.alert('Success', 'Stock updated successfully')
      setModalVisible(false)
      fetchProducts()
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const handlePriceUpdate = async () => {
    if (!selectedProduct || !newPrice) {
      Alert.alert('Error', 'Please enter a price')
      return
    }

    const price = parseFloat(newPrice)
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price')
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ selling_price: price })
        .eq('id', selectedProduct.id)

      if (error) throw error

      Alert.alert('Success', 'Price updated successfully')
      setModalVisible(false)
      fetchProducts()
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const calculateTotals = () => {
    const totalBuyingValue = filteredProducts.reduce((sum, p) => sum + (p.cost_price * p.stock_quantity), 0)
    const totalSellingValue = filteredProducts.reduce((sum, p) => sum + (p.selling_price * p.stock_quantity), 0)
    return { totalBuyingValue, totalSellingValue }
  }

  const { totalBuyingValue, totalSellingValue } = calculateTotals()

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.productHeader}>
        <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[
          styles.stockBadge,
          item.stock_quantity <= item.min_stock_level && styles.lowStock
        ]}>
          {item.stock_quantity} units
        </Text>
      </View>
      
      {item.sku && <Text style={[styles.productSku, { color: colors.textSecondary }]}>SKU: {item.sku}</Text>}
      
      <View style={styles.priceRow}>
        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Price:</Text>
        <Text style={[styles.priceValue, { color: colors.primary }]}>
          {currency ? formatCurrency(item.selling_price, currency) : `$${item.selling_price.toFixed(2)}`}
        </Text>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => openPriceModal(item)}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => openAdjustModal(item, 'add')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deductButton]}
          onPress={() => openAdjustModal(item, 'deduct')}
        >
          <Ionicons name="remove-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Deduct</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={toggleShowTotals} style={styles.iconButton}>
          <Ionicons 
            name={showTotals ? "eye-outline" : "eye-off-outline"} 
            size={22} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {showTotals && currency && (
        <View style={[styles.totalsCard, { backgroundColor: colors.card }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Buying Value:</Text>
            <Text style={[styles.totalValue, { color: colors.warning }]}>
              {formatCurrency(totalBuyingValue, currency)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Selling Value:</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>
              {formatCurrency(totalSellingValue, currency)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.profitRow]}>
            <Text style={[styles.totalLabel, { color: colors.text, fontWeight: '600' }]}>Potential Profit:</Text>
            <Text style={[styles.totalValue, { color: colors.primary, fontWeight: 'bold' }]}>
              {formatCurrency(totalSellingValue - totalBuyingValue, currency)}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchProducts}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {newPrice !== '' ? 'Update Price' : `${adjustmentType === 'add' ? 'Add' : 'Deduct'} Stock`}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={[styles.modalProductName, { color: colors.text }]}>{selectedProduct?.name}</Text>
              
              {newPrice !== '' ? (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>New Selling Price</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter new price"
                    placeholderTextColor={colors.textSecondary}
                    value={newPrice}
                    onChangeText={setNewPrice}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handlePriceUpdate}
                  >
                    <Text style={styles.submitButtonText}>Update Price</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.currentStock, { color: colors.textSecondary }]}>
                    Current Stock: {selectedProduct?.stock_quantity} units
                  </Text>

                  <Text style={[styles.label, { color: colors.text }]}>Quantity</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter quantity"
                    placeholderTextColor={colors.textSecondary}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="number-pad"
                  />

                  <Text style={[styles.label, { color: colors.text }]}>Reason (Optional)</Text>
                  <TextInput
                    style={[styles.modalInput, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter reason for adjustment"
                    placeholderTextColor={colors.textSecondary}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                  />

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleStockAdjustment}
                  >
                    <Text style={styles.submitButtonText}>
                      {adjustmentType === 'add' ? 'Add Stock' : 'Deduct Stock'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  totalsCard: {
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  profitRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  productCard: {
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
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  stockBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  lowStock: {
    backgroundColor: '#FF5252',
  },
  productSku: {
    fontSize: 14,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  iconButton: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  deductButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  currentStock: {
    fontSize: 14,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
