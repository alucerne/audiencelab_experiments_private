-- Create agency_credit_pricing table
CREATE TABLE IF NOT EXISTS public.agency_credit_pricing (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  credit_type text NOT NULL CHECK (credit_type IN ('audience', 'enrichment', 'pixel', 'custom_model')),
  price_per_credit_cents integer NOT NULL DEFAULT 0,
  cost_per_credit_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_id, credit_type)
);

-- Create overage_credit_purchases table
CREATE TABLE IF NOT EXISTS public.overage_credit_purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  credit_type text NOT NULL CHECK (credit_type IN ('audience', 'enrichment', 'pixel', 'custom_model')),
  credits integer NOT NULL DEFAULT 0,
  price_per_credit_cents integer NOT NULL DEFAULT 0,
  cost_per_credit_cents integer NOT NULL DEFAULT 0,
  billed_to_client boolean NOT NULL DEFAULT false,
  billed_to_agency boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE public.agency_credit_pricing IS 'Stores per-credit pricing for each agency';
COMMENT ON TABLE public.overage_credit_purchases IS 'Stores client overage credit purchases for billing';

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_agency_credit_pricing_agency_id ON public.agency_credit_pricing(agency_id);
CREATE INDEX IF NOT EXISTS ix_overage_credit_purchases_client_id ON public.overage_credit_purchases(client_id);
CREATE INDEX IF NOT EXISTS ix_overage_credit_purchases_agency_id ON public.overage_credit_purchases(agency_id);
CREATE INDEX IF NOT EXISTS ix_overage_credit_purchases_billed_to_client ON public.overage_credit_purchases(billed_to_client);

-- Set up RLS
ALTER TABLE public.agency_credit_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overage_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_credit_pricing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.overage_credit_purchases TO authenticated;
GRANT ALL ON public.agency_credit_pricing TO service_role;
GRANT ALL ON public.overage_credit_purchases TO service_role;

-- RLS Policies for agency_credit_pricing
CREATE POLICY "Users can view their agency's credit pricing" ON public.agency_credit_pricing
  FOR SELECT TO authenticated
  USING (
    public.has_role_on_account(agency_id)
  );

CREATE POLICY "Agency owners can manage their credit pricing" ON public.agency_credit_pricing
  FOR ALL TO authenticated
  USING (
    public.has_role_on_account(agency_id) AND 
    public.has_permission(auth.uid(), agency_id, 'billing.manage'::app_permissions)
  );

-- RLS Policies for overage_credit_purchases
CREATE POLICY "Clients can view their own purchases" ON public.overage_credit_purchases
  FOR SELECT TO authenticated
  USING (
    public.has_role_on_account(client_id)
  );

CREATE POLICY "Clients can create their own purchases" ON public.overage_credit_purchases
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role_on_account(client_id)
  );

CREATE POLICY "Agencies can view their clients' purchases" ON public.overage_credit_purchases
  FOR SELECT TO authenticated
  USING (
    public.has_role_on_account(agency_id)
  );

CREATE POLICY "Service role can manage all purchases" ON public.overage_credit_purchases
  FOR ALL TO service_role
  USING (true);

-- Insert default pricing for existing agencies (if any)
-- This will be populated by the application when agencies set their pricing 