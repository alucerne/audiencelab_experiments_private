# CURL Test Commands for AddCreditsPanel API

## Test Agency Pricing API

```bash
# Test the agency pricing endpoint
curl -X GET "http://localhost:3000/api/agency-pricing?agencyId=test-agency-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Expected response:
```json
{
  "audience": 2500,
  "enrichment": 1500,
  "pixel": 1000,
  "custom_model": 5000
}
```

## Test Purchase Credits Action (Server Action)

This is a server action, so it's called from the frontend component. The action is tested through the UI.

## Database Verification Queries

After making a purchase, you can verify the data was saved correctly:

```sql
-- Check overage credit purchases
SELECT * FROM overage_credit_purchases 
WHERE client_id = 'your-client-id' 
ORDER BY created_at DESC;

-- Check updated credit balances
SELECT * FROM credits 
WHERE account_id = 'your-client-id';

-- Check agency pricing
SELECT * FROM agency_credit_pricing 
WHERE agency_id = 'your-agency-id';
```

## Component Testing Checklist

1. **UI & Price Accuracy**
   - [ ] Prices shown match agency configuration
   - [ ] Changing quantities updates subtotals immediately
   - [ ] Grand total is calculated correctly
   - [ ] Purchase button is disabled when no quantities > 0

2. **Purchase Workflow**
   - [ ] Form submits successfully
   - [ ] Credits are added to account immediately
   - [ ] Purchase records are saved to database
   - [ ] Form resets after successful purchase

3. **Data Accuracy**
   - [ ] overage_credit_purchases table receives correct data
   - [ ] price_per_credit and cost_per_credit match agency values
   - [ ] billed_to_client = false (not yet charged)
   - [ ] client_credit_balances updates appropriately 