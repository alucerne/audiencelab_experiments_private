# Magic Signup Implementation Test Guide

## ✅ MILESTONE 3 COMPLETED: Magic Sign-Up Link with Embedded Payment Gateway

### 🔧 Issues Fixed:

1. **State Management Issue**: Moved `resellPrices` state from `Step2` component to parent `CreateCodeForm` component
2. **Scope Issues**: Fixed variable access in `onSubmit` function and Step3 component
3. **Database Schema**: Added `resell_prices` and `total_amount_cents` fields to `signup_codes` table
4. **TypeScript Types**: Updated database types and server action schemas

### 🧪 Testing Checklist:

#### ✅ Link Generation
- [ ] Magic link is generated with amount_cents, agency_id, and plan_id in query string
- [ ] Copying/sharing the link preserves correct formatting
- [ ] Amount calculation is accurate based on resell prices

#### ✅ Signup Flow Step 1 (Account)
- [ ] Entering email + password correctly creates a new user account
- [ ] Flow automatically transitions to step 2
- [ ] Error handling for invalid inputs

#### ✅ Signup Flow Step 2 (Payment)
- [ ] Amount_cents is displayed as $XX.XX accurately
- [ ] Stripe test card works in development mode
- [ ] On success:
  - [ ] Card is saved to Stripe customer
  - [ ] Client record is updated with stripe_customer_id
  - [ ] Redirect occurs to success page

#### ✅ Fallbacks
- [ ] Errors in either step are caught and surfaced clearly
- [ ] Edge case: user refreshes page on step 2 and still sees the right amount

### 🚀 How to Test:

1. **Start the Application**:
   ```bash
   cd web-app
   pnpm dev
   ```

2. **Create a Magic Signup Link**:
   - Go to `http://localhost:3001` (or the port shown in terminal)
   - Navigate to white-label → signup links → create new
   - Fill in Step 1 (signup details)
   - In Step 2, set resell prices and assign credits
   - Submit to generate the magic link

3. **Test the Magic Signup Flow**:
   - Copy the generated magic signup link
   - Open in incognito/private browser
   - Complete Step 1 (account creation)
   - Complete Step 2 (payment with test card)
   - Verify success page and redirect

### 🔧 Technical Implementation Details:

#### Files Modified:
1. **`create-code-dialog.tsx`**:
   - Moved `resellPrices` state to parent component
   - Updated Step2 to accept props
   - Fixed variable scope in onSubmit and Step3

2. **`white-label.service.ts`**:
   - Updated `createSignupLink` method to handle resell prices
   - Added database insert for new fields

3. **`server-actions.ts`**:
   - Updated schema to include resell prices and total amount

4. **Database Migration**:
   - Added `resell_prices` (JSONB) and `total_amount_cents` (INTEGER) columns
   - Updated TypeScript types

#### New Files Created:
1. **`/signup-magic/page.tsx`** - 2-step signup flow
2. **`/signup-magic/success/page.tsx`** - Success page
3. **`/api/magic-signup/create-account/route.ts`** - Account creation API
4. **`/api/magic-signup/create-payment/route.ts`** - Payment creation API
5. **`/api/magic-signup/verify-payment/route.ts`** - Payment verification API

### 💳 Stripe Test Cards:
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Expired: `4000000000000069`

### 🎯 Expected Behavior:

1. **Magic Link Generation**:
   - Format: `/signup-magic?agency_id=abc123&amount_cents=8900&plan_id=xyz789`
   - Amount calculated from resell prices × assigned credits

2. **2-Step Signup Flow**:
   - Step 1: Account creation with email/password
   - Step 2: Payment with Stripe Checkout
   - Success page with payment details

3. **Database Integration**:
   - Account created in Supabase
   - Stripe customer created
   - Payment method saved for future billing

The implementation is now complete and should work without the previous errors! 🎉 