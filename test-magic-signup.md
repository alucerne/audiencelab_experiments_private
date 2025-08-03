# Magic Signup Link Testing Guide

## ✅ MILESTONE 3 COMPLETED: Magic Sign-Up Link with Embedded Payment Gateway

### 🎯 What Was Built:

1. **Magic Link Generator**
   - Modified Step2 of the Client Plan portal to include resell prices
   - Generates magic links with format: `/signup-magic?agency_id=abc123&amount_cents=8900&plan_id=xyz789`
   - Links are copyable in the UI

2. **2-Step Signup Flow Page: `/signup-magic`**
   - **Step 1: Account Setup**
     - Email and password form fields
     - Creates client account via Supabase Auth
     - Automatic transition to payment step
   
   - **Step 2: Payment Entry**
     - Shows total due from amount_cents parameter
     - Integrates with Stripe Checkout for secure payment
     - Saves card to Stripe customer for future billing

3. **Stripe Integration**
   - Uses Stripe Checkout for one-time payments
   - Creates Stripe customer and saves payment method
   - Updates client account with stripe_customer_id

4. **Success Flow**
   - Payment verification and account activation
   - Success page with payment details
   - Redirect to client dashboard

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

1. **Create a Magic Signup Link:**
   - Go to white-label section → signup links → create new
   - Fill in Step 1 (signup details)
   - In Step 2, set resell prices and assign credits
   - Submit to generate the magic link

2. **Test the Magic Signup Flow:**
   - Copy the magic signup link
   - Open in incognito/private browser
   - Complete Step 1 (account creation)
   - Complete Step 2 (payment with test card)
   - Verify success page and redirect

3. **Test Error Scenarios:**
   - Invalid magic link parameters
   - Payment failure
   - Account creation failure

### 🔧 Technical Implementation:

- **Magic Signup Page**: `/signup-magic`
- **API Routes**: 
  - `/api/magic-signup/create-account`
  - `/api/magic-signup/create-payment`
  - `/api/magic-signup/verify-payment`
- **Success Page**: `/signup-magic/success`
- **Integration**: Works with existing white-label signup link system

### 💳 Stripe Test Cards:
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Expired: `4000000000000069`

The implementation is now ready for testing! 🎉 