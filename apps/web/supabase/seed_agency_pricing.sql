-- Seed sample agency pricing data for testing
-- This script can be run manually to populate test data

-- Insert sample agency pricing (replace with actual agency IDs from your database)
INSERT INTO public.agency_credit_pricing (agency_id, credit_type, price_per_credit_cents, cost_per_credit_cents)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'audience', 2500, 2000),      -- $25.00 per credit, $20.00 cost
  ('00000000-0000-0000-0000-000000000001', 'enrichment', 1500, 1200),    -- $15.00 per credit, $12.00 cost
  ('00000000-0000-0000-0000-000000000001', 'pixel', 1000, 800),          -- $10.00 per credit, $8.00 cost
  ('00000000-0000-0000-0000-000000000001', 'custom_model', 5000, 4000)   -- $50.00 per credit, $40.00 cost
ON CONFLICT (agency_id, credit_type) DO UPDATE SET
  price_per_credit_cents = EXCLUDED.price_per_credit_cents,
  cost_per_credit_cents = EXCLUDED.cost_per_credit_cents,
  updated_at = now();

-- Note: Replace the agency_id with actual agency IDs from your accounts table
-- You can find agency IDs by running: SELECT id, name FROM accounts WHERE is_personal_account = false; 