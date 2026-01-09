/*
  # Criar tabelas faltantes do sistema de leads

  1. Tabelas
    - captured_leads
    - lead_activities
    - lead_capture_config

  2. Índices e triggers
  3. RLS policies
*/

-- CAPTURED LEADS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'captured_leads') THEN
    CREATE TABLE captured_leads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id uuid REFERENCES lead_capture_campaigns(id) ON DELETE SET NULL,
      company_name text NOT NULL,
      cnpj text,
      email text,
      phone text,
      whatsapp text,
      address text,
      cep text,
      city text,
      state text,
      neighborhood text,
      business_type text,
      google_place_id text,
      google_rating numeric,
      google_reviews_count integer,
      website text,
      social_media jsonb DEFAULT '{}'::jsonb,
      source text NOT NULL DEFAULT 'manual' CHECK (source IN ('google_maps', 'correios', 'manual', 'api')),
      status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'qualificado', 'convertido', 'descartado')),
      priority text DEFAULT 'média' CHECK (priority IN ('baixa', 'média', 'alta')),
      notes text,
      tags text[] DEFAULT ARRAY[]::text[],
      converted_to_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
      assigned_to uuid REFERENCES employees(id) ON DELETE SET NULL,
      last_contact_at timestamptz,
      next_follow_up timestamptz,
      metadata jsonb DEFAULT '{}'::jsonb,
      captured_at timestamptz DEFAULT now(),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_campaign ON captured_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON captured_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON captured_leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON captured_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_cnpj ON captured_leads(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_source ON captured_leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON captured_leads(next_follow_up);

-- LEAD ACTIVITIES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_activities') THEN
    CREATE TABLE lead_activities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id uuid REFERENCES captured_leads(id) ON DELETE CASCADE,
      activity_type text NOT NULL CHECK (activity_type IN ('contato', 'email', 'whatsapp', 'reunião', 'proposta', 'anotação')),
      description text NOT NULL,
      outcome text CHECK (outcome IN ('sucesso', 'sem_resposta', 'reagendar', 'não_interessado', 'interessado')),
      performed_by uuid REFERENCES employees(id) ON DELETE SET NULL,
      performed_at timestamptz DEFAULT now(),
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_performed_by ON lead_activities(performed_by);
CREATE INDEX IF NOT EXISTS idx_activities_type ON lead_activities(activity_type);

-- LEAD CAPTURE CONFIG
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_capture_config') THEN
    CREATE TABLE lead_capture_config (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      google_maps_api_key text,
      enable_auto_cnpj_lookup boolean DEFAULT true,
      enable_auto_email_discovery boolean DEFAULT true,
      enable_auto_social_media_discovery boolean DEFAULT false,
      max_leads_per_campaign integer DEFAULT 1000,
      notification_email text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    INSERT INTO lead_capture_config (id) VALUES (gen_random_uuid());
  END IF;
END $$;

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_campaign_lead_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lead_capture_campaigns
    SET total_leads_captured = total_leads_captured + 1,
        updated_at = now()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_campaign_lead_count ON captured_leads;
CREATE TRIGGER trigger_update_campaign_lead_count
  AFTER INSERT ON captured_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_lead_count();

CREATE OR REPLACE FUNCTION update_lead_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lead_timestamp ON captured_leads;
CREATE TRIGGER trigger_update_lead_timestamp
  BEFORE UPDATE ON captured_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_timestamp();

DROP TRIGGER IF EXISTS trigger_update_campaign_timestamp ON lead_capture_campaigns;
CREATE TRIGGER trigger_update_campaign_timestamp
  BEFORE UPDATE ON lead_capture_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_timestamp();

-- RLS
ALTER TABLE captured_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_capture_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON captured_leads;
CREATE POLICY "Allow all for authenticated users"
  ON captured_leads FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON lead_activities;
CREATE POLICY "Allow all for authenticated users"
  ON lead_activities FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON lead_capture_config;
CREATE POLICY "Allow all for authenticated users"
  ON lead_capture_config FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);