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
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Product, Store } from '@/lib/types';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { formatCurrency } from '@/lib/utils';

export default function StockScreen() {
  const { currency } = useCurrency();
  const { colors } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [canAccessAllStores, setCanAccessAllStores] = useState<boolean | undefined>(undefined);
  const [userStoreId, setUserStoreId] = useState<string | null>(null);
  const [userContextLoaded, setUserContextLoaded] = useState(false);
  const [stockAdjustModalVisible, setStockAdjustModalVisible] = useState(false);
  const [newProductModalVisible, setNewProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New product form state
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductSku, setNewProductSku] = useState<string>('');
  const [newProductCostPrice, setNewProductCostPrice] = useState<string>('0');
  const [newProductSellingPrice, setNewProductSellingPrice] = useState<string>('0');
  const [newProductStock, setNewProductStock] = useState<string>('0');
  const [newProductMinStock, setNewProductMinStock] = useState<string>('10');
  const [newProductStoreId, setNewProductStoreId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const loadUserContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no user, set defaults to allow loading to complete
        setCanAccessAllStores(false);
        setUserStoreId(null);
        setUserContextLoaded(true);
        return;
      }

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
        
        // For non-admins, set their store as default
        if (!canAccessAll && storeId) {
          setSelectedStoreId(storeId);
        }
      } else {
        // If no profile found, set defaults
        setCanAccessAllStores(false);
        setUserStoreId(null);
      }
    } catch (error) {
      console.error('Error loading user context:', error);
      // Set defaults on error to prevent infinite loading
      setCanAccessAllStores(false);
      setUserStoreId(null);
    } finally {
      setUserContextLoaded(true);
    }
  };

  const loadStores = async (canAccess: boolean | undefined, userStore: string | null) => {
    try {
      let query = supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // For non-admins, only load their assigned store
      if (canAccess === false && userStore) {
        query = query.eq('id', userStore);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadProducts = async (showLoading = false) => {
    if (showLoading) {
      setIsLoadingProducts(true);
    }
    try {
      // Don't try to load if user context hasn't loaded yet
      if (!userContextLoaded) {
        return;
      }

      let query = supabase
        .from('products')
        .select('*')
        .order('stock_quantity', { ascending: true });

      // For admins, filter by selected store if one is selected
      // For non-admins, always filter by their assigned store
      if (canAccessAllStores === true) {
        if (selectedStoreId) {
          query = query.eq('store_id', selectedStoreId);
        }
      } else if (canAccessAllStores === false && userStoreId) {
        query = query.eq('store_id', userStoreId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading stock:', error);
      // Set empty array on error to prevent infinite loading
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadUserContext();
    };
    initialize();
  }, []);

  // Load stores after user context is loaded
  useEffect(() => {
    if (userContextLoaded) {
      loadStores(canAccessAllStores, userStoreId);
    }
  }, [userContextLoaded, canAccessAllStores, userStoreId]);

  useEffect(() => {
    // Wait for user context to be loaded first
    if (!userContextLoaded) return;

    // For non-admins, load products once userStoreId is set (even if stores array is empty)
    // For admins, wait for stores to load first
    if (canAccessAllStores === true) {
      if (stores.length > 0) {
        loadProducts();
      }
    } else if (canAccessAllStores === false) {
      // Non-admin: load products immediately when userStoreId is available (even if null)
      loadProducts();
    }
  }, [userContextLoaded, canAccessAllStores, userStoreId, stores.length]);

  useEffect(() => {
    // Only show loading dialog when switching shops (selectedStoreId changes after initial load)
    // Don't trigger on initial null -> userStoreId transition
    if (stores.length > 0 && selectedStoreId !== null && canAccessAllStores) {
      loadProducts(true);
    }
  }, [selectedStoreId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const getFilteredProducts = () => {
    let filtered = products;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
      );
    }

    // Apply stock filter
    if (filter === 'low') {
      filtered = filtered.filter((p) => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0);
    } else if (filter === 'out') {
      filtered = filtered.filter((p) => p.stock_quantity === 0);
    }

    return filtered;
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return { label: 'Out of Stock', color: colors.error, symbol: '✕' };
    }
    if (product.stock_quantity <= product.min_stock_level) {
      return { label: 'Low Stock', color: colors.warning, symbol: '⚠' };
    }
    return { label: 'In Stock', color: colors.success, symbol: '✓' };
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct) return;

    const quantity = parseInt(adjustQuantity);
    if (isNaN(quantity) || quantity === 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const newQuantity = selectedProduct.stock_quantity + quantity;
    if (newQuantity < 0) {
      Alert.alert('Error', 'Stock quantity cannot be negative');
      return;
    }

    setIsAdjusting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      // Update stock quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      // Create stock adjustment record
      const { error: adjustmentError } = await supabase
        .from('stock_adjustments')
        .insert({
          product_id: selectedProduct.id,
          adjustment_type: quantity > 0 ? 'addition' : 'subtraction',
          quantity: Math.abs(quantity),
          reason: adjustReason || null,
          created_by: user.id,
          store_id: selectedProduct.store_id || null,
        });

      if (adjustmentError) throw adjustmentError;

      Alert.alert('Success', `Stock ${quantity > 0 ? 'added' : 'removed'} successfully!`);
      setStockAdjustModalVisible(false);
      setAdjustQuantity('');
      setAdjustReason('');
      setSelectedProduct(null);
      loadProducts();
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      Alert.alert('Error', error.message || 'Failed to adjust stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }

    if (!newProductSku.trim()) {
      Alert.alert('Error', 'SKU is required');
      return;
    }

    if (!newProductStoreId) {
      Alert.alert('Error', 'Please select a shop');
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      const productData = {
        name: newProductName.trim(),
        sku: newProductSku.trim(),
        cost_price: parseFloat(newProductCostPrice) || 0,
        selling_price: parseFloat(newProductSellingPrice) || 0,
        stock_quantity: parseInt(newProductStock) || 0,
        min_stock_level: parseInt(newProductMinStock) || 10,
        store_id: newProductStoreId,
        created_by: user.id,
        is_active: true,
      };

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) throw error;

      Alert.alert('Success', 'Product created successfully!');
      setNewProductModalVisible(false);
      // Reset form
      setNewProductName('');
      setNewProductSku('');
      setNewProductCostPrice('0');
      setNewProductSellingPrice('0');
      setNewProductStock('0');
      setNewProductMinStock('10');
      setNewProductStoreId('');
      loadProducts();
    } catch (error: any) {
      console.error('Error creating product:', error);
      Alert.alert('Error', error.message || 'Failed to create product');
    } finally {
      setIsCreating(false);
    }
  };

  const openStockAdjustment = (product: Product) => {
    if (!product) return;
    setSelectedProduct(product);
    setAdjustQuantity('');
    setAdjustReason('');
    setStockAdjustModalVisible(true);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const status = getStockStatus(item);
    const stockPercentage = item.min_stock_level > 0
      ? (item.stock_quantity / (item.min_stock_level * 3)) * 100
      : 100;

    return (
      <TouchableOpacity
        style={[styles.stockCard, { backgroundColor: colors.surface }]}
        onPress={() => openStockAdjustment(item)}
      >
        <View style={styles.stockHeader}>
          <View style={styles.stockInfo}>
            <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
            {item.sku && (
              <Text style={[styles.productSku, { color: colors.textSecondary }]}>SKU: {item.sku}</Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${status.color}20` },
            ]}
          >
            <Text style={[styles.statusSymbol, { color: status.color }]}>
              {status.symbol}
            </Text>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.stockDetails}>
          <View style={styles.stockBarContainer}>
            <View style={[styles.stockBarBackground, { backgroundColor: colors.border }]}>
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
              <Text style={[styles.stockNumberLabel, { color: colors.textSecondary }]}>Current</Text>
              <Text style={[styles.stockNumberValue, { color: colors.text }]}>{item.stock_quantity}</Text>
            </View>
            <View style={styles.stockNumberItem}>
              <Text style={[styles.stockNumberLabel, { color: colors.textSecondary }]}>Min Level</Text>
              <Text style={[styles.stockNumberValue, { color: colors.text }]}>
                {item.min_stock_level}
              </Text>
            </View>
          </View>
          <View style={styles.productActions}>
            <Text style={[styles.tapHint, { color: colors.textSecondary }]}>Tap to adjust stock</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate total values
  const calculateTotalValues = () => {
    const filtered = getFilteredProducts();
    const totalSellingValue = filtered.reduce(
      (sum, p) => sum + (Number(p.selling_price) * Number(p.stock_quantity)),
      0
    );
    const totalBuyingValue = filtered.reduce(
      (sum, p) => sum + (Number(p.cost_price) * Number(p.stock_quantity)),
      0
    );
    return { totalSellingValue, totalBuyingValue };
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const filteredProducts = getFilteredProducts();
  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const { totalSellingValue, totalBuyingValue } = calculateTotalValues();

  const stylesWithTheme = StyleSheet.create({
    ...styles,
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    filterButton: {
      ...styles.filterButton,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    filterButtonActive: {
      ...styles.filterButtonActive,
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      ...styles.filterText,
      color: colors.textSecondary,
    },
    filterTextActive: {
      ...styles.filterTextActive,
      color: '#fff',
    },
    stockCard: {
      ...styles.stockCard,
      backgroundColor: colors.surface,
    },
    productName: {
      ...styles.productName,
      color: colors.text,
    },
    productSku: {
      ...styles.productSku,
      color: colors.textSecondary,
    },
    stockBarBackground: {
      ...styles.stockBarBackground,
      backgroundColor: colors.border,
    },
    stockNumberLabel: {
      ...styles.stockNumberLabel,
      color: colors.textSecondary,
    },
    stockNumberValue: {
      ...styles.stockNumberValue,
      color: colors.text,
    },
    emptyText: {
      ...styles.emptyText,
      color: colors.textSecondary,
    },
  });

  return (
    <>
      <Modal
        visible={isAdjusting || isCreating}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.loadingModal, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {isAdjusting ? 'Adjusting stock...' : isCreating ? 'Creating product...' : 'Processing...'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Loading Dialog for Shop Switching */}
      <Modal
        visible={isLoadingProducts}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.loadingModal, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading products...
            </Text>
          </View>
        </View>
      </Modal>

      <View style={stylesWithTheme.container}>
      {canAccessAllStores && stores.length > 0 && (
        <View style={styles.storeFilterContainer}>
          <TouchableOpacity
            style={[styles.storeFilterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setStoreModalVisible(true)}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>🏪</Text>
            <Text style={[styles.storeFilterText, { color: colors.text }]}>
              {selectedStore ? selectedStore.name : 'All Shops'}
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>▼</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
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

      {/* Total Values Summary */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
          <Text style={styles.summaryLabel}>Total Selling Value</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(totalSellingValue, currency || undefined)}
          </Text>
          <Text style={styles.summarySubtext}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.warning }]}>
          <Text style={styles.summaryLabel}>Total Buying Value</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(totalBuyingValue, currency || undefined)}
          </Text>
          <Text style={styles.summarySubtext}>
            Potential Profit: {formatCurrency(totalSellingValue - totalBuyingValue, currency || undefined)}
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[stylesWithTheme.filterButton, filter === 'all' && stylesWithTheme.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              stylesWithTheme.filterText,
              filter === 'all' && stylesWithTheme.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[stylesWithTheme.filterButton, filter === 'low' && stylesWithTheme.filterButtonActive]}
          onPress={() => setFilter('low')}
        >
          <Text
            style={[
              stylesWithTheme.filterText,
              filter === 'low' && stylesWithTheme.filterTextActive,
            ]}
          >
            Low Stock
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[stylesWithTheme.filterButton, filter === 'out' && stylesWithTheme.filterButtonActive]}
          onPress={() => setFilter('out')}
        >
          <Text
            style={[
              stylesWithTheme.filterText,
              filter === 'out' && stylesWithTheme.filterTextActive,
            ]}
          >
            Out of Stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            // Pre-select store when opening modal
            if (canAccessAllStores === true && selectedStoreId) {
              // Admin: pre-select the currently selected store
              setNewProductStoreId(selectedStoreId);
            } else if (canAccessAllStores === false && userStoreId) {
              // Non-admin: pre-select their assigned store
              setNewProductStoreId(userStoreId);
            }
            setNewProductModalVisible(true);
          }}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>➕</Text>
          <Text style={styles.actionButtonText}>New Product</Text>
        </TouchableOpacity>
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
            <Text style={{ fontSize: 64, marginBottom: 16 }}>📦</Text>
            <Text style={stylesWithTheme.emptyText}>No products found</Text>
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

      {/* Stock Adjustment Modal */}
      <Modal
        visible={stockAdjustModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setStockAdjustModalVisible(false);
          setSelectedProduct(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Adjust Stock</Text>
              <TouchableOpacity onPress={() => {
                setStockAdjustModalVisible(false);
                setSelectedProduct(null);
              }}>
                <Text style={{ fontSize: 24, color: colors.text }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedProduct ? (
              <ScrollView showsVerticalScrollIndicator={true}>
                <View style={[styles.productInfoSection, { backgroundColor: colors.background }]}>
                  <Text style={[styles.productInfoLabel, { color: colors.textSecondary }]}>Product:</Text>
                  <Text style={[styles.productInfoValue, { color: colors.text }]}>{selectedProduct.name}</Text>
                  <Text style={[styles.productInfoLabel, { color: colors.textSecondary }]}>Current Stock:</Text>
                  <Text style={[styles.productInfoValue, { color: colors.text }]}>{selectedProduct.stock_quantity}</Text>
                </View>

                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Quantity *</Text>
                  <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                    Enter positive number to add, negative to remove (e.g., +5 or -3)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={adjustQuantity}
                    onChangeText={setAdjustQuantity}
                    placeholder="e.g., 5 or -3"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Reason (Optional)</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={adjustReason}
                    onChangeText={setAdjustReason}
                    placeholder="Reason for adjustment..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {adjustQuantity && !isNaN(parseInt(adjustQuantity)) && (
                  <View style={[styles.previewSection, { backgroundColor: colors.background }]}>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>New Stock:</Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>
                      {selectedProduct.stock_quantity + parseInt(adjustQuantity)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                    (isAdjusting || !adjustQuantity || isNaN(parseInt(adjustQuantity))) && { opacity: 0.5 }
                  ]}
                  onPress={handleStockAdjustment}
                  disabled={isAdjusting || !adjustQuantity || isNaN(parseInt(adjustQuantity))}
                >
                  <Text style={styles.submitButtonText}>
                    {isAdjusting ? 'Adjusting...' : 'Adjust Stock'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading product...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* New Product Modal */}
      <Modal
        visible={newProductModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNewProductModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.newProductModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Product</Text>
              <TouchableOpacity onPress={() => setNewProductModalVisible(false)}>
                <Text style={{ fontSize: 24, color: colors.text }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Product Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={newProductName}
                  onChangeText={setNewProductName}
                  placeholder="Enter product name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>SKU *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={newProductSku}
                  onChangeText={setNewProductSku}
                  placeholder="Enter SKU"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Shop *</Text>
                {stores.length === 0 ? (
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                    Loading stores...
                  </Text>
                ) : (
                  <View style={styles.storeSelectContainer}>
                    {stores.map((store) => (
                      <TouchableOpacity
                        key={store.id}
                        style={[
                          styles.storeSelectButton,
                          {
                            backgroundColor: newProductStoreId === store.id ? colors.primary : colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => setNewProductStoreId(store.id)}
                      >
                        <Text
                          style={[
                            styles.storeSelectText,
                            {
                              color: newProductStoreId === store.id ? '#fff' : colors.text,
                              fontWeight: newProductStoreId === store.id ? '600' : '400',
                            },
                          ]}
                        >
                          {store.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputSection, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Cost Price</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={newProductCostPrice}
                    onChangeText={setNewProductCostPrice}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputSection, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Selling Price</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={newProductSellingPrice}
                    onChangeText={setNewProductSellingPrice}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputSection, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Initial Stock</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={newProductStock}
                    onChangeText={setNewProductStock}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputSection, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Min Stock Level</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={newProductMinStock}
                    onChangeText={setNewProductMinStock}
                    placeholder="10"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.success }]}
                onPress={handleCreateProduct}
                disabled={isCreating || !newProductName.trim() || !newProductSku.trim() || !newProductStoreId}
              >
                <Text style={styles.submitButtonText}>
                  {isCreating ? 'Creating...' : 'Create Product'}
                </Text>
              </TouchableOpacity>
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
  storeFilterContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
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
  storeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  storeFilterText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    paddingBottom: 8,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonActive: {
    // Will be overridden by theme
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  stockCard: {
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
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 4,
  },
  stockNumberValue: {
    fontSize: 18,
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
    paddingBottom: 0,
    width: '100%',
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
  actionButtonsContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productActions: {
    marginTop: 8,
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  adjustModalContent: {
    maxHeight: 600,
  },
  newProductModalContent: {
    maxHeight: 700,
  },
  modalScrollView: {
    maxHeight: 500,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  productInfoSection: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  productInfoLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  productInfoValue: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  previewSection: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  storeSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeSelectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  storeSelectText: {
    fontSize: 14,
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
