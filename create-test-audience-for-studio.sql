-- Create test audience for Studio testing
INSERT INTO public.audience (id, name, account_id, created_at, updated_at, deleted, filters)
VALUES (
  'studio-test-audience-001',
  'Studio Test Audience - Tech Companies',
  '5b006b9f-e7b0-4a22-a915-cb60e26ce78e',
  NOW(),
  NOW(),
  false,
  '{"filters": {"businessProfile": {"industry": ["Computer Software"]}}}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- Verify the audience was created
SELECT 
  id,
  name,
  account_id,
  created_at,
  deleted
FROM public.audience 
WHERE account_id = '5b006b9f-e7b0-4a22-a915-cb60e26ce78e'
  AND deleted = false
ORDER BY created_at DESC; 