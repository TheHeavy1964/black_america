-- ==========================================
-- BLACK AMERICA DASHBOARD — Supabase Schema
-- ==========================================

-- Organizations master table
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('financial_literacy', 'startup', 'leadership', 'community', 'grassroots')),
  subcategory TEXT,
  year_featured INTEGER NOT NULL CHECK (year_featured >= 2020 AND year_featured <= 2026),
  year_founded INTEGER,
  source_url TEXT,
  location_city TEXT,
  location_state TEXT,
  leaders TEXT[] DEFAULT '{}',
  mission TEXT,
  evidence_type TEXT CHECK (evidence_type IN ('media_coverage', 'research', 'self_reported', 'government_data')),
  impact_metric TEXT,
  tags TEXT[] DEFAULT '{}',
  funding_amount BIGINT,
  cohort_size INTEGER,
  population_served TEXT,
  delivery_model TEXT CHECK (delivery_model IN ('in_person', 'virtual', 'hybrid', 'app', 'platform')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unknown', 'pending_review')),
  summary TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_org_category ON organizations(category);
CREATE INDEX IF NOT EXISTS idx_org_year ON organizations(year_featured);
CREATE INDEX IF NOT EXISTS idx_org_state ON organizations(location_state);
CREATE INDEX IF NOT EXISTS idx_org_status ON organizations(status);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Public read policy (dashboard is public-facing)
CREATE POLICY "Public read access" ON organizations
  FOR SELECT USING (true);

-- Admin write policy (authenticated users can insert/update)
CREATE POLICY "Authenticated write access" ON organizations
  FOR ALL USING (auth.role() = 'authenticated');
