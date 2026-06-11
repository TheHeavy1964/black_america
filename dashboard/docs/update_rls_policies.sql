-- ==========================================
-- SUPABASE SCHEMA UPDATE & POLICY MIGRATION
-- ==========================================

-- 1. Update status check constraint to support 'pending_review' status
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_status_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_status_check CHECK (status IN ('active', 'inactive', 'unknown', 'pending_review'));

-- 2. Allow the public/anon key to submit records (or pipelines to write drafts)
-- Once an admin approves a record (status -> 'active'), the public can no longer edit it.
DROP POLICY IF EXISTS "Allow public insert and update of pending review drafts" ON organizations;
CREATE POLICY "Allow public insert and update of pending review drafts" ON organizations
  FOR ALL
  TO public
  USING (status = 'pending_review')
  WITH CHECK (status = 'pending_review');
