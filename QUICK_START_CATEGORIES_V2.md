# Quick Start Guide: Category Reservations v2

## What's New?

Your budget tracker now has a smarter way to manage categories and reserved funds!

## Setup in 3 Easy Steps

### Step 1: Run the Database Migration

In your Supabase SQL Editor, run:

```sql
-- File: sql/supabase_category_reservations_v2.sql
```

This updates your database to support the new reservation system.

### Step 2: Create Your Categories

#### Income Categories
1. Go to **Categories** tab
2. Tap the **Income** tab
3. Create categories like:
   - 💼 Job
   - 💻 Freelance
   - 📹 YouTube
   - 🏢 Business
   - 🎁 Gifts

#### Expense Categories
1. Stay on **Categories** tab
2. Tap the **Expense** tab
3. Create categories like:
   - 🏋️ GYM
   - 🛒 Groceries
   - ⛽ Fuel
   - 🎬 Entertainment
   - 💊 Medicine

### Step 3: Reserve Funds for Expenses

For expense categories where you want to set aside money:

1. Tap on an **Expense** category card
2. Tap **"Reserve Funds"**
3. Choose **"Add Funds"**
4. Select an **Account** (Bank, Cash, etc.)
5. Enter the **Amount** to reserve
6. Tap **"Add Funds"**

**Example:**
- Reserve ₹10,000 from "Bank Account" for GYM
- Reserve ₹4,500 from "Cash" for GYM
- Now GYM has ₹14,500 total reserved from 2 accounts!

## How It Works

### Creating Income Transactions

1. Tap **"Add Transaction"** on Transactions tab
2. Select **"Income"** type
3. Choose **To Account** (where money goes)
4. Select **Income Category** (optional)
5. Enter amount and note
6. Submit!

### Creating Expense Transactions

1. Tap **"Add Transaction"** on Transactions tab
2. Select **"Expense"** type
3. Choose **From Account** (where money comes from)
4. Categories will show:
   - **Reserved (for this account)**: Categories with funds set aside from this account
   - **Unreserved**: All other expense categories
5. Select a category (optional)
6. Enter amount and note
7. Submit!

**Smart Validation:**
- If you select a **Reserved** category, you can't spend more than the reserved amount
- The reservation automatically decreases when you spend

### Checking Your Account Status

Go to **Accounts** tab to see:

1. **Total Balance**: All money in the account
2. **Reserved Money**: Breakdown by category
   - 🏋️ GYM: ₹10,000
   - 🛒 Groceries: ₹5,000
   - etc.
3. **Unreserved**: Money not allocated to categories

## Real-World Example

### Scenario: Monthly Gym Budget

**Accounts:**
- Bank Account: ₹50,000
- Cash: ₹10,000

**Step 1: Create GYM Category**
- Type: Expense
- Emoji: 🏋️
- Name: "GYM"

**Step 2: Reserve Funds**
- From Bank Account: ₹8,000 (for membership)
- From Cash: ₹2,000 (for supplements)
- **Total Reserved: ₹10,000**

**Step 3: Make Transactions**

*Transaction 1: Gym Membership*
- Type: Expense
- From: Bank Account
- Category: 🏋️ GYM (shows ₹8,000 reserved)
- Amount: ₹5,000
- Result: GYM reservation from Bank = ₹3,000 left

*Transaction 2: Supplements*
- Type: Expense
- From: Cash
- Category: 🏋️ GYM (shows ₹2,000 reserved)
- Amount: ₹1,500
- Result: GYM reservation from Cash = ₹500 left

**Final Status:**
- GYM Category:
  - Bank Account: ₹3,000 reserved
  - Cash: ₹500 reserved
  - **Total: ₹3,500 remaining**

### Scenario: Income Tracking

**Step 1: Create Income Categories**
- 💼 Salary
- 💻 Freelance
- 📹 YouTube

**Step 2: Record Income**

*Transaction 1: Monthly Salary*
- Type: Income
- To: Bank Account
- Category: 💼 Salary
- Amount: ₹50,000

*Transaction 2: Freelance Project*
- Type: Income
- To: Bank Account
- Category: 💻 Freelance
- Amount: ₹15,000

Now you can track how much you earned from each source!

## Pro Tips

### 1. Reserve from Multiple Accounts
One category can have reservations from multiple accounts:
- Useful when you keep money in different places
- Example: Restaurant budget from both Bank and Cash

### 2. Use Unreserved Categories
Not all expense categories need reservations:
- Use reserved categories for planned expenses (GYM, Groceries)
- Use unreserved categories for random expenses (Coffee, Shopping)

### 3. Review in Accounts Screen
Check your accounts regularly to see:
- How much is reserved vs. unreserved
- Which categories are consuming your budget
- Available balance for new reservations

### 4. Adjust Reservations Anytime
- Add more funds: When you want to increase budget
- Withdraw funds: When you over-allocated or plans changed
- Delete reservation: To make all funds unreserved again

## FAQs

**Q: What happens to my old fund categories?**
A: They're automatically converted to expense categories with reservations. No data is lost!

**Q: Can I have a category without reservations?**
A: Yes! Unreserved categories work like simple labels. Great for tracking without strict budgets.

**Q: Can I reserve from an account that doesn't have enough balance?**
A: No, the system validates that the account has sufficient balance.

**Q: What if I try to spend more than reserved?**
A: The transaction will fail with an error message. You need to either reduce the amount or add more funds to the reservation.

**Q: Can I change a category's type later?**
A: No, once created, a category's type (income/expense) is fixed. Delete and recreate if needed.

**Q: Where did the Plan screen go?**
A: All fund management is now in the **Categories** screen! It's more intuitive and powerful.

## Need Help?

If something's not working:
1. Make sure you ran the database migration
2. Try refreshing the screens (pull down)
3. Check that your accounts have sufficient balance
4. Verify category types are set correctly

Enjoy your new budget tracking experience! 🎉

