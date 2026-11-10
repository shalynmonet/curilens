/*
# Create Curilens analysis schema (single-tenant, no auth)

1. New Tables
- `analyses`: Top-level analysis record for each screenshot submitted.
  - id (uuid, PK)
  - title (text) — auto-generated topic title
  - topic (text) — extracted topic/category
  - status (text) — pipeline status: pending, extracting, identifying, researching, verifying, rewriting, completed, error
  - image_url (text) — URL to stored screenshot in Supabase Storage
  - image_path (text) — storage bucket path for deletion
  - extracted_text (text) — OCR-extracted text from screenshot
  - extracted_text_edited (text) — user-corrected version of extracted text
  - concise_assessment (text) — short summary assessment
  - supported_count (int) — number of supported claims
  - contradicted_count (int) — number of contradicted claims
  - unresolved_count (int) — number of unresolved claims
  - factual_rewrite (text) — factual rewrite of the content
  - exploratory_rewrite (text) — exploratory/philosophical rewrite
  - error_message (text) — error message if pipeline failed
  - created_at (timestamptz)
  - updated_at (timestamptz)

- `claims`: Individual claim assessments belonging to an analysis.
  - id (uuid, PK)
  - analysis_id (uuid, FK to analyses, CASCADE)
  - claim_text (text) — the original claim text
  - claim_type (text) — factual, opinion, metaphor, philosophical, prediction, unverifiable
  - verification_status (text) — supported, contradicted, unresolved, insufficient_evidence
  - explanation (text) — detailed explanation of assessment
  - evidence_summary (text) — summary of evidence for/against
  - uncertainty (text) — description of relevant uncertainty
  - created_at (timestamptz)

- `evidence_sources`: Sources referenced by claims.
  - id (uuid, PK)
  - claim_id (uuid, FK to claims, CASCADE)
  - title (text)
  - url (text)
  - author (text, nullable)
  - publication (text, nullable)
  - date (text, nullable)
  - passage (text) — relevant evidence passage from the source
  - relevance (text) — how this source relates to the claim
  - created_at (timestamptz)

- `recommendations`: Keep Exploring recommendations for an analysis.
  - id (uuid, PK)
  - analysis_id (uuid, FK to analyses, CASCADE)
  - title (text)
  - author (text)
  - publication_info (text, nullable)
  - url (text)
  - relevance_explanation (text)
  - classification (text) — supports, challenges, contextualizes, explores
  - created_at (timestamptz)

2. Security
- Enable RLS on all tables.
- Grant CRUD to anon + authenticated on all tables (single-tenant, no auth — data is intentionally accessible to the app's anon-key client).
- Policies allow all operations for anon + authenticated (USING true / WITH CHECK true) because this is a no-auth app where analyses are private records accessed via opaque UUIDs, not a multi-user system.
- Grant service_role CRUD on all tables (edge functions use the service role key to write analysis results).
*/

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  topic text,
  status text NOT NULL DEFAULT 'pending',
  image_url text,
  image_path text,
  extracted_text text,
  extracted_text_edited text,
  concise_assessment text,
  supported_count integer DEFAULT 0,
  contradicted_count integer DEFAULT 0,
  unresolved_count integer DEFAULT 0,
  factual_rewrite text,
  exploratory_rewrite text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON analyses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON analyses TO service_role;

DROP POLICY IF EXISTS "anon_select_analyses" ON analyses;
CREATE POLICY "anon_select_analyses" ON analyses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_analyses" ON analyses;
CREATE POLICY "anon_insert_analyses" ON analyses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_analyses" ON analyses;
CREATE POLICY "anon_update_analyses" ON analyses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_analyses" ON analyses;
CREATE POLICY "anon_delete_analyses" ON analyses FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  claim_text text NOT NULL,
  claim_type text DEFAULT 'factual',
  verification_status text DEFAULT 'unresolved',
  explanation text,
  evidence_summary text,
  uncertainty text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON claims TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON claims TO service_role;

DROP POLICY IF EXISTS "anon_select_claims" ON claims;
CREATE POLICY "anon_select_claims" ON claims FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_claims" ON claims;
CREATE POLICY "anon_insert_claims" ON claims FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_claims" ON claims;
CREATE POLICY "anon_update_claims" ON claims FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_claims" ON claims;
CREATE POLICY "anon_delete_claims" ON claims FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS evidence_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  author text,
  publication text,
  date text,
  passage text,
  relevance text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evidence_sources ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_sources TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_sources TO service_role;

DROP POLICY IF EXISTS "anon_select_evidence_sources" ON evidence_sources;
CREATE POLICY "anon_select_evidence_sources" ON evidence_sources FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_evidence_sources" ON evidence_sources;
CREATE POLICY "anon_insert_evidence_sources" ON evidence_sources FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_evidence_sources" ON evidence_sources;
CREATE POLICY "anon_update_evidence_sources" ON evidence_sources FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_evidence_sources" ON evidence_sources;
CREATE POLICY "anon_delete_evidence_sources" ON evidence_sources FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text NOT NULL,
  publication_info text,
  url text NOT NULL,
  relevance_explanation text NOT NULL,
  classification text DEFAULT 'explores',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON recommendations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recommendations TO service_role;

DROP POLICY IF EXISTS "anon_select_recommendations" ON recommendations;
CREATE POLICY "anon_select_recommendations" ON recommendations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_recommendations" ON recommendations;
CREATE POLICY "anon_insert_recommendations" ON recommendations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_recommendations" ON recommendations;
CREATE POLICY "anon_update_recommendations" ON recommendations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_recommendations" ON recommendations;
CREATE POLICY "anon_delete_recommendations" ON recommendations FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_claims_analysis_id ON claims(analysis_id);
CREATE INDEX IF NOT EXISTS idx_evidence_sources_claim_id ON evidence_sources(claim_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_analysis_id ON recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
