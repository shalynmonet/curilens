/*
# Enforce per-user ownership, private screenshot storage, and revocable intake tokens

Plain-English summary: every analysis now belongs to one signed-in user, and that user is the only person who can read, change, or delete it. The public (no sign-in) access that was previously open to everyone is removed. Screenshots are stored in per-user folders that only their owner can access. A new "intake connections" table lets a user create revocable tokens for the iPhone Shortcut, storing only a hash of each token.

1. Modified Tables
- `analyses`: new column `user_id` (uuid, required, defaults to the signed-in user, references auth.users, cascades on account deletion). Index added on (user_id, created_at).
- `claims`, `evidence_sources`, `recommendations`: no new columns. Access now follows the owning analysis.

2. New Tables
- `intake_tokens`: one row per iPhone Shortcut connection.
  - id, user_id (owner), label, token_hash (SHA-256 of the token, never the token itself), created_at, last_used_at, revoked_at.

3. New Function
- `create_intake_token(p_label)`: signed-in users only. Generates a random token, stores its hash, and returns the plain token once.

4. Security
- Removed every policy that allowed anonymous or public access on analyses, claims, evidence_sources, and recommendations.
- Removed anonymous grants on all four tables.
- Signed-in users can only read, update, and delete their own analyses. They can create analyses only with an image path, and only as themselves.
- Users can only read and update their own analysis text; they cannot change status, results, or ownership.
- Claims, evidence sources, and recommendations are read-only for their owner. Background processing writes them using the server role.
- Storage bucket `screenshots` stays private. Users can only write, read, and delete objects inside a folder named with their own user id.
- Intake tokens are visible to their owner without the hash column. Only revoking (setting revoked_at) is allowed from the client.

5. Important Notes
- Section 1 is idempotent: IF NOT EXISTS and DROP POLICY IF EXISTS are used throughout.
- The table was empty when this migration was written, so the new required column causes no data loss.
- Existing screenshot links saved as temporary signed URLs are no longer used; the app now stores only the file path and creates links on demand.
*/

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON analyses(user_id, created_at DESC);

DROP POLICY IF EXISTS "anon_select_analyses" ON analyses;
DROP POLICY IF EXISTS "anon_insert_analyses" ON analyses;
DROP POLICY IF EXISTS "anon_update_analyses" ON analyses;
DROP POLICY IF EXISTS "anon_delete_analyses" ON analyses;
DROP POLICY IF EXISTS "anon_select_claims" ON claims;
DROP POLICY IF EXISTS "anon_insert_claims" ON claims;
DROP POLICY IF EXISTS "anon_update_claims" ON claims;
DROP POLICY IF EXISTS "anon_delete_claims" ON claims;
DROP POLICY IF EXISTS "anon_select_evidence_sources" ON evidence_sources;
DROP POLICY IF EXISTS "anon_insert_evidence_sources" ON evidence_sources;
DROP POLICY IF EXISTS "anon_update_evidence_sources" ON evidence_sources;
DROP POLICY IF EXISTS "anon_delete_evidence_sources" ON evidence_sources;
DROP POLICY IF EXISTS "anon_select_recommendations" ON recommendations;
DROP POLICY IF EXISTS "anon_insert_recommendations" ON recommendations;
DROP POLICY IF EXISTS "anon_update_recommendations" ON recommendations;
DROP POLICY IF EXISTS "anon_delete_recommendations" ON recommendations;

REVOKE ALL ON analyses, claims, evidence_sources, recommendations FROM anon;
REVOKE ALL ON analyses, claims, evidence_sources, recommendations FROM authenticated;

GRANT SELECT ON analyses TO authenticated;
GRANT INSERT (image_path, image_url) ON analyses TO authenticated;
GRANT UPDATE (extracted_text_edited, updated_at) ON analyses TO authenticated;
GRANT DELETE ON analyses TO authenticated;

GRANT SELECT ON claims, evidence_sources, recommendations TO authenticated;

DROP POLICY IF EXISTS "owner_select_analyses" ON analyses;
CREATE POLICY "owner_select_analyses" ON analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert_analyses" ON analyses;
CREATE POLICY "owner_insert_analyses" ON analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_analyses" ON analyses;
CREATE POLICY "owner_update_analyses" ON analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete_analyses" ON analyses;
CREATE POLICY "owner_delete_analyses" ON analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_select_claims" ON claims;
CREATE POLICY "owner_select_claims" ON claims FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM analyses a WHERE a.id = claims.analysis_id AND a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_select_evidence_sources" ON evidence_sources;
CREATE POLICY "owner_select_evidence_sources" ON evidence_sources FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN analyses a ON a.id = c.analysis_id
      WHERE c.id = evidence_sources.claim_id AND a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "owner_select_recommendations" ON recommendations;
CREATE POLICY "owner_select_recommendations" ON recommendations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM analyses a WHERE a.id = recommendations.analysis_id AND a.user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS intake_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_intake_tokens_user ON intake_tokens(user_id);

ALTER TABLE intake_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON intake_tokens FROM anon, authenticated;
GRANT SELECT (id, user_id, label, created_at, last_used_at, revoked_at) ON intake_tokens TO authenticated;
GRANT UPDATE (revoked_at) ON intake_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON intake_tokens TO service_role;

DROP POLICY IF EXISTS "owner_select_intake_tokens" ON intake_tokens;
CREATE POLICY "owner_select_intake_tokens" ON intake_tokens FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_intake_tokens" ON intake_tokens;
CREATE POLICY "owner_update_intake_tokens" ON intake_tokens FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_intake_token(p_label text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_token text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  IF p_label IS NULL OR length(trim(p_label)) = 0 OR length(trim(p_label)) > 60 THEN
    RAISE EXCEPTION 'Label must be between 1 and 60 characters';
  END IF;

  v_token := 'cl_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.intake_tokens (user_id, label, token_hash)
  VALUES (v_uid, trim(p_label), encode(sha256(convert_to(v_token, 'UTF8')), 'hex'));

  RETURN v_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_intake_token(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_intake_token(text) TO authenticated;

UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
WHERE id = 'screenshots';

DROP POLICY IF EXISTS "screenshots_owner_insert" ON storage.objects;
CREATE POLICY "screenshots_owner_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "screenshots_owner_select" ON storage.objects;
CREATE POLICY "screenshots_owner_select" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "screenshots_owner_delete" ON storage.objects;
CREATE POLICY "screenshots_owner_delete" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text
  );
