# Magic Signup Link Testing with CURL

## ✅ MILESTONE 3 COMPLETED: Magic Sign-Up Link with Embedded Payment Gateway

### 🧪 Testing the Implementation

The application is now running on `http://localhost:3001`. Here are the CURL commands to test the magic signup functionality:

#### 1. Test Magic Signup Page (Step 1 - Account Setup)
```bash
# Test the magic signup page with valid parameters
curl -X GET "http://localhost:3001/signup-magic?agency_id=123e4567-e89b-12d3-a456-426614174000&amount_cents=8900&plan_id=TESTCODE123" \
  -H "Content-Type: application/json"
```

#### 2. Test Account Creation API
```bash
# Test account creation (Step 1)
curl -X POST "http://localhost:3001/api/magic-signup/create-account" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "agencyId": "123e4567-e89b-12d3-a456-426614174000",
    "planId": "TESTCODE123"
  }'
```

#### 3. Test Payment Creation API
```bash
# Test payment session creation (Step 2)
curl -X POST "http://localhost:3001/api/magic-signup/create-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "amountCents": 8900,
    "agencyId": "123e4567-e89b-12d3-a456-426614174000",
    "planId": "TESTCODE123",
    "accountData": {
      "email": "test@example.com",
      "password": "testpassword123"
    }
  }'
```

#### 4. Test Payment Verification API
```bash
# Test payment verification (after successful payment)
curl -X POST "http://localhost:3001/api/magic-signup/verify-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cs_test_..."
  }'
```

### 🎯 What Was Implemented:

1. **Magic Link Generator**
   - Enhanced Step2 of Client Plan portal with resell prices
   - Generates magic links with embedded billing amount
   - Links are copyable and shareable

2. **2-Step Signup Flow (`/signup-magic`)**
   - **Step 1**: Account Setup with email/password
   - **Step 2**: Payment Entry with Stripe integration
   - Clean UI with step indicators and progress animation

3. **API Endpoints**
   - `/api/magic-signup/create-account` - Creates user account
   - `/api/magic-signup/create-payment` - Creates Stripe checkout session
   - `/api/magic-signup/verify-payment` - Verifies payment completion

4. **Database Schema**
   - Added `resell_prices` (JSONB) and `total_amount_cents` (INTEGER) to `signup_codes` table
   - Updated TypeScript types and database migrations

### 🔧 Technical Details:

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Supabase
- **Payment**: Stripe Checkout integration
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth

### 🚀 Next Steps:

1. **Test the UI Flow**:
   - Go to `http://localhost:3001`
   - Navigate to white-label → signup links → create new
   - Set resell prices in Step 2
   - Generate magic signup link

2. **Test the Magic Signup Flow**:
   - Copy the generated magic link
   - Open in incognito browser
   - Complete account creation
   - Complete payment with test card

3. **Verify Integration**:
   - Check account creation in Supabase
   - Verify Stripe customer creation
   - Confirm payment processing

The implementation is now complete and ready for testing! 🎉 