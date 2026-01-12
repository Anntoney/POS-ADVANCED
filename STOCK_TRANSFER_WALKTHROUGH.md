# Stock Transfer Walkthrough Guide

## Overview
This guide explains how to enable stock transfer permissions and how to make and receive stock transfers between stores.

---

## Part 1: Enabling Stock Transfer Permission

### Step 1: Access User Management
1. Log in as an **Admin** user
2. Navigate to **Settings** from the sidebar
3. Click on the **Users** tab
4. You'll see a list of all users in the system

### Step 2: Grant Stock Transfer Permission
1. Find the user (e.g., "Liz" or any cashier) you want to grant stock transfer permission to
2. Click the **"Manage Permissions"** button (or permissions icon) next to that user
3. A dialog will open showing all available permissions
4. Scroll down and find **"Stock Transfer"** in the list
5. Toggle the switch next to **"Stock Transfer"** to **ON** (it will turn blue/active)
6. Click **"Save Permissions"** at the bottom
7. The permission is now enabled for that user

---

## Part 2: Making a Stock Transfer (Sending Store)

### Prerequisites
- You must have **Stock Transfer** permission enabled
- You must be assigned to a store
- There must be at least 2 active stores in the system
- The source store must have products with available stock

### Step 1: Navigate to Stock Transfer Page
1. Go to **Stock** from the sidebar
2. On the Stock Management page, click the **"Transfer Stock"** button (top right)
   - Alternatively, you can access it directly at `/dashboard/stock/transfer`

### Step 2: Fill Out Transfer Form
1. **Select From Store**: Choose your store (the source store where stock is currently located)
2. **Select To Store**: Choose the destination store (where you want to send the stock)
   - Note: The "To Store" dropdown will only show after selecting "From Store"
   - You cannot select the same store for both
3. **Select Product**: 
   - After selecting "From Store", a list of products with available stock will appear
   - Select the product you want to transfer
   - The form will show available stock quantity for that product
4. **Enter Quantity**: 
   - Enter the number of units to transfer
   - The quantity cannot exceed the available stock
   - Maximum available quantity is shown below the input
5. **Add Notes (Optional)**: 
   - Add any notes about the transfer (e.g., "Urgent restock needed", "Return to main store")
6. Click **"Create Transfer"** button

### Step 3: Confirmation
- You'll see a success message: "Stock transfer created successfully! The receiving store has been notified."
- The transfer is now in **"Pending"** status
- All users in the receiving store will receive a notification about the incoming transfer

---

## Part 3: Receiving a Stock Transfer (Receiving Store)

### Step 1: Check for Notifications
When a stock transfer is created for your store, you'll receive a notification:
- **Title**: "New Stock Transfer"
- **Message**: Shows quantity, product name, and source store
- Example: "5 units of Product Name transferred from Store A. Please confirm receipt."

### Step 2: View Transfer Logs
1. Go to **Stock** from the sidebar
2. Click **"Transfer Logs"** button (or navigate to `/dashboard/stock/transfers`)
3. You'll see a table of all stock transfers

### Step 3: Find Your Pending Transfer
- Look for transfers where:
  - **To Store** = Your store name
  - **Status** = "Pending" (shown with an outline badge)
- The transfer will show:
  - Transfer number (e.g., TRF-0001)
  - From Store (source)
  - Product name and SKU
  - Quantity
  - Date created
  - Created by (who initiated it)

### Step 4: Confirm Receipt
1. Find the pending transfer intended for your store
2. Click the **green checkmark (✓)** button in the **Actions** column
3. A confirmation dialog will appear: "Are you sure you want to complete this transfer? This will move the stock between stores."
4. Click **"OK"** to confirm
5. The transfer status will change to **"Completed"** (green badge)
6. The stock will be:
   - **Deducted** from the source store
   - **Added** to your store's inventory
   - If the product doesn't exist in your store, it will be created automatically

### Step 5: Verify Stock Update
1. Go back to **Stock** page
2. Check that the product now shows the updated quantity in your store
3. The transfer is complete!

---

## Part 4: Viewing Transfer History (Admin)

### As an Admin:
1. Navigate to **Stock** → **Transfer Logs**
2. You can see **all transfers** across all stores
3. You have additional actions:
   - **Complete Transfer** (✓): Can complete any pending transfer
   - **Cancel Transfer** (✕): Can cancel any pending transfer (only admins)

### Transfer Statuses:
- **Pending** (outline badge): Transfer created but not yet confirmed
- **Completed** (default badge): Transfer confirmed and stock moved
- **Cancelled** (secondary badge): Transfer was cancelled

---

## Important Notes

### For Sending Store:
- ✅ You can only transfer stock from your assigned store
- ✅ Stock is reserved when transfer is created (but not deducted until confirmed)
- ✅ You'll see a notification when the receiving store confirms

### For Receiving Store:
- ✅ You can only confirm transfers intended for your store
- ✅ You'll receive notifications when transfers are created for your store
- ✅ Once confirmed, stock is immediately added to your inventory
- ✅ If product doesn't exist in your store, it's automatically created

### System Behavior:
- Stock is **not deducted** from source store until receiving store confirms
- If transfer is cancelled, no stock movement occurs
- All transfers are logged for audit purposes
- Admins can view all transfers regardless of store

---

## Troubleshooting

### "You need at least 2 active stores"
- Make sure you have at least 2 stores created and active in Settings → Stores

### "No products with stock available"
- The selected store doesn't have any products with stock quantity > 0
- Add stock to products first via Stock Adjustments

### "Insufficient stock"
- You're trying to transfer more than available
- Check the available quantity shown in the form

### Can't see "Confirm Receipt" button
- Make sure you're logged in as a user from the receiving store
- Only users from the receiving store (or admins) can confirm transfers

### Notifications not appearing
- Make sure you're assigned to the receiving store
- Check that notifications table exists (run `scripts/009_create_notifications_table.sql`)

---

## Quick Reference

| Action | Location | Permission Required |
|--------|----------|-------------------|
| Enable Permission | Settings → Users → Manage Permissions | Admin |
| Create Transfer | Stock → Transfer Stock | stock_transfer |
| View Logs | Stock → Transfer Logs | stock_transfer |
| Confirm Receipt | Transfer Logs → Actions (✓) | stock_transfer + Receiving Store |
| Cancel Transfer | Transfer Logs → Actions (✕) | Admin only |

---

## Example Workflow

**Scenario**: Store A needs to send 10 units of "Product X" to Store B

1. **Cashier at Store A**:
   - Goes to Stock → Transfer Stock
   - Selects: From Store = Store A, To Store = Store B
   - Selects Product X (shows 50 units available)
   - Enters quantity: 10
   - Clicks "Create Transfer"
   - ✅ Transfer created, notification sent to Store B

2. **Cashier at Store B**:
   - Receives notification: "10 units of Product X transferred from Store A"
   - Goes to Stock → Transfer Logs
   - Finds pending transfer (Status: Pending)
   - Clicks ✓ to confirm receipt
   - ✅ Stock moved: Store A now has 40 units, Store B now has 10 units

3. **Admin** (optional):
   - Can view all transfers in Transfer Logs
   - Can complete or cancel any pending transfer
   - Can see full audit trail

---

**End of Walkthrough**
