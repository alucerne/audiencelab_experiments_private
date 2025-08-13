#!/bin/bash

# Example: Loading Pixel Data from Google Cloud Storage
# This shows how a user would load their pixel data from GCS

BASE_URL="http://localhost:3010"
GCS_URL="https://storage.googleapis.com/staging_tests_main/Pixel_Local_Test%20-%20random_contacts.csv"

echo "📊 Loading Pixel Data from Google Cloud Storage"
echo "==============================================="
echo ""

echo "🔗 GCS URL: $GCS_URL"
echo ""

echo "📋 Step 1: Load Data from GCS"
echo "-----------------------------"
echo "Loading your CSV file from Google Cloud Storage into DuckDB"
echo ""

LOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/studio/audiences/select" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$GCS_URL\",
    \"format\": \"csv\"
  }")

echo "Response: $LOAD_RESPONSE"
echo ""

if echo "$LOAD_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✅ Data loaded successfully from GCS!"
    
    # Extract row count
    LOADED_ROWS=$(echo "$LOAD_RESPONSE" | grep -o '"loaded_rows":[0-9]*' | cut -d':' -f2)
    VIEW_ROWS=$(echo "$LOAD_RESPONSE" | grep -o '"view_rows":[0-9]*' | cut -d':' -f2)
    
    echo "   Loaded rows: $LOADED_ROWS"
    echo "   View rows: $VIEW_ROWS"
    echo ""
    
    echo "📋 Step 2: Preview the Loaded Data"
    echo "----------------------------------"
    PREVIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/api/studio/filters/preview" \
      -H "Content-Type: application/json" \
      -d '{
        "filters": [],
        "limit": 3,
        "offset": 0
      }')
    
    echo "Preview Response: $PREVIEW_RESPONSE"
    echo ""
    
    echo "📋 Step 3: Test Filtering on Real Data"
    echo "--------------------------------------"
    FILTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/studio/filters/preview" \
      -H "Content-Type: application/json" \
      -d '{
        "filters": [
          {
            "field": "event_type",
            "op": "=",
            "value": "page_view"
          }
        ],
        "limit": 3,
        "offset": 0
      }')
    
    echo "Filter Response: $FILTER_RESPONSE"
    echo ""
    
    echo "📋 Step 4: Test Contact Data Filtering"
    echo "--------------------------------------"
    CONTACT_FILTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/studio/filters/preview" \
      -H "Content-Type: application/json" \
      -d '{
        "filters": [
          {
            "field": "COMPANY_INDUSTRY",
            "op": "=",
            "value": "Technology"
          }
        ],
        "limit": 3,
        "offset": 0
      }')
    
    echo "Contact Filter Response: $CONTACT_FILTER_RESPONSE"
    echo ""
    
    echo "🎉 Success! Your pixel data is now loaded and queryable!"
    echo ""
    echo "💡 You can now:"
    echo "   - Filter by any field in the unified catalog"
    echo "   - Extract JSON data from event_data"
    echo "   - Combine pixel events with contact data"
    echo "   - Create complex multi-field filters"
    echo "   - Save queries as segments"
    echo ""
    echo "📊 Sample Queries You Can Try:"
    echo "   - Find all page_view events with percentage > 50"
    echo "   - Filter by company industry (Technology, Healthcare, etc.)"
    echo "   - Find contacts with specific job titles"
    echo "   - Filter by geographic location (city, state)"
    echo "   - Find high-value contacts (net worth, income range)"
    
else
    echo "❌ Failed to load data from GCS"
    echo "Error: $LOAD_RESPONSE"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Make sure the server is running"
    echo "2. Check if the GCS bucket is publicly accessible"
    echo "3. Verify the URL is correct"
    echo "4. Check the server logs for detailed error messages"
    echo ""
    echo "📋 Alternative: Use Test Data"
    echo "----------------------------"
    echo "For testing, you can use our test data instead:"
    echo ""
    TEST_RESPONSE=$(curl -s "$BASE_URL/api/studio/test")
    echo "Test Data Response: $TEST_RESPONSE"
fi

echo ""
echo "🔗 Your GCS Bucket:"
echo "   $GCS_URL"
echo ""
echo "📚 Next Steps:"
echo "1. Test with the UI components in the Studio"
echo "2. Create segments from your filtered data"
echo "3. Integrate with your audience management system"
echo "4. Set up automated data loading from GCS" 