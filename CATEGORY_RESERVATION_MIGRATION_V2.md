# Category Reservation System v2 - Migration Guide

## Overview

This migration completely revamps the category and fund system to be more flexible and intuitive:

### Previous System (Funds)
- Categories had types: `regular` or `fund`
- Fund categories could only be linked to ONE account
- Separate "Plan" screen for managing funds
- Complex fund management UI

### New System (Reservations)
- Categories have types: `income` or `expense`
- Expense categories can have reservations from MULTIPLE accounts
- Example: "GYM" category can have ₹10,000 reserved from Bank Account AND ₹4,500 reserved from Cash
- All management happens in the Categories screen
- Cleaner, more intuitive UI

## Key Changes

### 1. Database Changes
- **New Table**: `category_reservations` - tracks funds reserved from accounts for expense categories
- **Updated**: `categories.category_type` now accepts `income` | `expense` instead of `regular` | `fund`
- **Migration**: Existing fund categories are automatically migrated to expense categories with reservations

### 2. Categories Screen
- **New Tabs**: Switch between Income and Expense categories
- **Income Categories**: Simple labels (title, emoji, color)
- **Expense Categories**: Can have funds reserved from multiple accounts
- **Reservation Management**: Add/withdraw funds directly from category cards
- Shows total reserved amount and breakdown by account

### 3. Transaction Creation Flow
- **Account First**: User must select account before category
- **Smart Category Display**:
  - For **Income**: Shows all income categories
  - For **Expense**: Shows categories grouped as:
    - **Reserved** (for selected account): Categories with funds reserved from this account, with amounts
    - **Unreserved**: All other expense categories

### 4. Accounts Screen
- Shows **Total Balance**
- Shows **Reserved Money**: Breakdown by category with amounts
- Shows **Unreserved Money**: Available balance not allocated to any category
- Link to Categories screen for managing reservations

### 5. Plan Screen
- Repurposed to redirect users to the Categories screen
- Shows helpful information about the new system

## Migration Steps

### Step 1: Run Database Migration

Execute the SQL migration file in your Supabase SQL editor:

```bash
sql/supabase_category_reservations_v2.sql
```

This will:
1. Create the `category_reservations` table
2. Migrate existing fund categories to the new system
3. Set up helper functions for managing reservations
4. Update category_type constraints

### Step 2: Test the Application

1. **Categories Screen**:
   - Create income categories (e.g., "Job", "Freelance", "Business")
   - Create expense categories (e.g., "GYM", "Groceries", "Transport")
   - Reserve funds from accounts for expense categories
   - Add/withdraw funds using the reservation management UI

2. **Transactions Screen**:
   - Create income transaction: Select account → Select income category
   - Create expense transaction: Select account → See reserved/unreserved categories
   - Test spending from reserved categories

3. **Accounts Screen**:
   - Verify reserved money is shown correctly
   - Check unreserved balance calculation
   - Test navigation to Categories screen

## Database Schema

### category_reservations Table

```sql
CREATE TABLE category_reservations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  account_id UUID REFERENCES accounts(id),
  reserved_amount BIGINT (in smallest currency unit),
  currency TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(category_id, account_id) -- One reservation per category-account pair
);
```

### Helper Functions

1. **adjust_category_reservation(category_id, account_id, amount_delta)**
   - Add or withdraw funds from a reservation
   - Automatically creates reservation if it doesn't exist
   - Validates ownership and balances

2. **delete_category_reservation(category_id, account_id)**
   - Removes a reservation
   - Returns boolean success status

## TypeScript Types

### CategoryType
```typescript
export type CategoryType = "income" | "expense";
```

### CategoryReservation
```typescript
export interface CategoryReservation {
  id: string;
  user_id: string;
  category_id: string;
  account_id: string;
  reserved_amount: number; // in smallest currency unit
  currency: string;
  created_at: string;
  updated_at: string;
}
```

### Updated Category
```typescript
export interface Category {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  background_color: string;
  category_type: CategoryType; // "income" | "expense"
  // Legacy fund fields kept for backward compatibility
  fund_balance?: number;
  fund_currency?: string | null;
  fund_account_id?: string | null;
  fund_target_amount?: number | null;
  created_at: string;
  updated_at: string;
}
```

## User Benefits

1. **More Flexible**: Reserve funds from multiple accounts for the same category
2. **Clearer UI**: Income and Expense tabs make it obvious what each category is for
3. **Better Transaction Flow**: Account-first approach ensures reservations are shown correctly
4. **Unified Management**: Everything in one place (Categories screen)
5. **Better Visibility**: Accounts screen clearly shows what's reserved vs unreserved

## Notes

- Old fund-related columns in the `categories` table are kept for backward compatibility but not used
- Existing data is automatically migrated
- No user data is lost
- The Plan screen is repurposed to guide users to the new system

## Rollback (If Needed)

If you need to rollback:

1. The old fund columns still exist in the categories table
2. You can restore the old screens from git history
3. Drop the `category_reservations` table
4. Restore the old `category_type` constraint

However, note that any reservations created with the new system will be lost.

