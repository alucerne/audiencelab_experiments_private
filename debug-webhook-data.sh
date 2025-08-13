#!/bin/bash

# Debug script for webhook data flow
echo "🔍 Debugging Webhook Data Flow"
echo "=============================="

# Base URL for local development
BASE_URL="http://localhost:3000"

# Create a unique webhook ID
WEBHOOK_ID="debug-$(date +%s)"

echo "📋 Test 1: Create webhook endpoint"
echo "Webhook ID: $WEBHOOK_ID"
echo ""

# Test 1: Send simple test data
echo "📤 Test 2: Send simple test data"
echo "Expected: Should appear in table immediately"

curl -X POST "$BASE_URL/api/webhook/$WEBHOOK_ID" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "business_email": "test1@example.com",
      "company_name": "Test Company 1",
      "first_name": "John",
      "last_name": "Doe"
    },
    {
      "business_email": "test2@example.com", 
      "company_name": "Test Company 2",
      "first_name": "Jane",
      "last_name": "Smith"
    }
  ]'

echo ""
echo ""

# Test 2: Check webhook data
echo "📋 Test 3: Check webhook data"
echo "Expected: Should see the test data"

curl -X GET "$BASE_URL/api/webhook/$WEBHOOK_ID"

echo ""
echo ""

echo "✅ Debug tests completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Go to Studio in your browser"
echo "2. Select 'Webhook Data' tab"
echo "3. Create a new webhook or select the debug webhook"
echo "4. Check browser console for debug logs"
echo "5. Verify data appears in the table"
echo ""
echo "🔍 Debug Info to Check:"
echo "- Browser console should show 'Webhook data change' logs"
echo "- Table should show 2 rows with business_email, company_name, first_name, last_name"
echo "- Debug panel should show data source as 'webhook'" 