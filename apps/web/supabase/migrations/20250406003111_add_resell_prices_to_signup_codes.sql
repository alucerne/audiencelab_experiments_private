-- Add resell_prices and total_amount_cents columns to signup_codes table
ALTER TABLE public.signup_codes 
ADD COLUMN IF NOT EXISTS resell_prices jsonb,
ADD COLUMN IF NOT EXISTS total_amount_cents integer;

-- Add comments for documentation
COMMENT ON COLUMN public.signup_codes.resell_prices IS 'JSON object containing resell prices for different credit types';
COMMENT ON COLUMN public.signup_codes.total_amount_cents IS 'Total amount in cents for the magic signup link'; 