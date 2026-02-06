# Mobile App Improvements Required

## Changes Requested:

### 1. Remove Store Name from Receipt
- Currently shows "STORE NAME" at the top
- Should be removed completely

### 2. Show Cashier Name (from Profile)
- Currently shows "System User"
- Should show the actual user's name from their profile (like "Antonev Thuo" from dashboard)
- Get from user profile/auth data

### 3. Add Change to Receipt
- If customer pays more than total, show the change amount
- Example: Total: KSH210, Paid: KSH500, Change: KSH290

### 4. Add Total Gross Profit to Sales View
- Currently only shows "Total Sales"
- Should also show "Total Gross" (profit)
- Calculate as: Sum of (selling_price - cost_price) * quantity for all items

---

## Files to Modify:

### For Receipt Changes (1, 2, 3):
Need to find the receipt generation component in mobile app. Likely in:
- `mobileapp/components/` folder (if exists)
- Or embedded in a POS/sales screen

### For Sales View (4):
**File:** `mobileapp/app/(tabs)/sales.tsx`

**Current code shows:**
```typescript
const total = (data || []).reduce((sum, sale) => sum + sale.total_amount, 0)
setTotalSales(total)
```

**Need to add:**
```typescript
// Fetch sale items with product cost prices
const { data: saleItems } = await supabase
  .from('sale_items')
  .select(`
    quantity,
    unit_price,
    product:products(cost_price)
  `)
  .in('sale_id', data.map(s => s.id))

// Calculate gross profit
const grossProfit = saleItems.reduce((sum, item) => {
  const profit = (item.unit_price - item.product.cost_price) * item.quantity
  return sum + profit
}, 0)

setTotalGross(grossProfit)
```

**Display in UI:**
```tsx
<View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
  <Text style={styles.summaryLabel}>Total Sales</Text>
  <Text style={styles.summaryValue}>
    {currency ? formatCurrency(totalSales, currency) : `${totalSales.toFixed(2)}`}
  </Text>
  
  <Text style={styles.summaryLabel}>Total Gross Profit</Text>
  <Text style={styles.summaryValue}>
    {currency ? formatCurrency(totalGross, currency) : `${totalGross.toFixed(2)}`}
  </Text>
  
  <Text style={styles.summaryCount}>{sales.length} transactions</Text>
</View>
```

---

## Implementation Priority:

1. **High Priority:** Add Total Gross to Sales View (straightforward)
2. **Medium Priority:** Find and modify receipt component for store name, cashier, and change

---

## Next Steps:

1. Search for receipt generation code in mobile app
2. Implement sales gross profit calculation
3. Test all changes before rebuilding APK

