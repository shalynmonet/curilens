/*
# Fix client analysis insert grant and intake owner handling

Plain-English summary: lets a signed-in user's upload create an analysis with its initial status, and lets the server-side intake path record which user owns each analysis.

1. Modified Tables
- `analyses`: the signed-in insert grant now includes `status`, `user_id` is not granted to clients.

2. Security
- Clients still cannot set `user_id` explicitly; the default is `auth.uid()` and the insert policy requires it to match.
- Idempotent: grants are re-applied safely.

3. Notes
- The intake path runs with the server role and sets `user_id` explicitly from the verified token.
*/

GRANT INSERT (image_path, image_url, status) ON analyses TO authenticated;
GRANT UPDATE (extracted_text_edited, updated_at) ON analyses TO authenticated;
