# Curilens

**Look closer. Learn deeper.**

Curilens helps curious readers, students, and educators investigate claims encountered online. Upload a screenshot or send one through an iPhone Shortcut to extract claims, retrieve sources, and see which claims are supported, contradicted, or unresolved by the supplied evidence. Factual and exploratory rewrites provide context, while Keep Exploring links to retrieved publications.

Live app: https://curilens.sha-i.com

## How it works

1. Sign in using an email link.
2. Upload a screenshot, or create a revocable connection token on Share Setup and configure an Apple Shortcut.
3. Gemini transcribes the image. Clocked image extraction provides a fallback when transcription fails.
4. Clocked screens the text, redacts supported personal information, extracts verbatim claims, and prepares a topic and search query.
5. Tavily retrieves external documents with source text. Clocked screens those documents, selects relevant evidence, compares sources, and checks claims against that evidence.
6. Gemini generates factual and exploratory rewrites. If optional writing fails, the app preserves a deterministic evidence report.
7. Keep Exploring builds links from retrieved document titles and URLs, independently of rewrite generation. Related reading is distinguished from evidence supporting or contradicting a claim.

Clocked verifies grounding against documents supplied to it. Tavily supplies external search results. Neither a retrieved page nor a successful API call alone establishes that a claim is true. Missing evidence, conflicting sources, failed checks, or unmatched results remain unresolved. Medical and financial topics are conservatively kept unresolved for expert review.

## Clocked integration

| Endpoint | Application role |
|---|---|
| Guard (Injection) | Screens extracted text and retrieved documents before downstream prompts |
| Protect (PII) | Redacts supported personal-information categories from extracted text |
| Extract | Extracts verbatim claims; provides fallback image transcription |
| Decide | Identifies high-stakes topics |
| Fill | Structures the topic, search query, and detected code |
| Inspect (Script) | Checks executable code when present and adds warnings |
| Rerank | Selects evidence relevant to claims |
| Compare | Identifies duplicate or conflicting sources when multiple sources are available |
| Verify (Grounding) | Checks claims against supplied documents, with claim matching and quotation validation |

The results screen exposes completed, failed, and skipped checks. Execution is conditional; all nine endpoints need not run for every screenshot. A completed check indicates an API response, not an endorsement of the input.

## Technology

- React, TypeScript, Vite, and Tailwind CSS
- Supabase Auth, PostgreSQL, private Storage, and Edge Functions
- Gemini for primary image transcription and rewrites
- Tavily for evidence retrieval
- Clocked for the checks described above
- Apple Shortcuts for iPhone Share Sheet intake

The Shortcut sends multipart form data with an `image` field to `/functions/v1/share`, using its connection token in `X-Curilens-Token` or as a Bearer token. The endpoint returns `analysisId` and starts analysis in the background. The Shortcut opens the processing page for that ID. The app also redirects unfinished analysis pages to processing.

## Configuration and deployment

| Variable | Scope | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public Supabase client key; access depends on authentication and database policies |
| `GEMINI_API_KEY` | Server secret | Gemini API access |
| `GEMINI_MODEL` | Optional server setting | Model override; source default is `gemini-3.1-flash-lite` |
| `CLOCKED_API_KEY` | Server secret | Clocked API access |
| `TAVILY_API_KEY` | Server secret | External evidence retrieval |
| `SUPABASE_URL` | Supabase runtime | Backend project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase runtime secret | Privileged backend database and storage access |

Keep provider keys and service-role credentials out of frontend variables, source control, and screenshots. The public Supabase client key is intentionally available to the browser.

For local frontend development, configure the two `VITE_` variables in a local `.env` file, then run:

```sh
npm install
npm run dev
```

Validation and production build:

```sh
npm run typecheck
npm run build
node scripts/test-clocked.mjs
node scripts/test-resilience.mjs
node scripts/test-exploring.mjs
```

For a new Supabase installation, apply the SQL migrations in `supabase/migrations` in filename order, configure email-link authentication and allowed redirect URLs, set server secrets, and deploy both functions. `supabase/config.toml` requires JWT verification for `analyze`. `share` uses its own revocable connection-token authorization and has gateway JWT verification disabled.

```sh
supabase functions deploy analyze
supabase functions deploy share
```

Publish the Vite `dist` directory through the frontend host with SPA route fallback. Frontend publishing and Edge Function deployment are separate operations. Applying migrations and deploying functions are required; publishing the frontend alone does not update the server. For an existing installation, compare migration history before applying changes.

## Privacy and reliability

Sign-in gates personal analyses. Database and storage policies restrict users to their own records and screenshot folders. Shortcut tokens are stored as hashes and can be revoked. Screenshots use private storage and signed viewing URLs.

Processing sends screenshots to Gemini, or Clocked when image-extraction fallback is used. Extracted text and retrieved evidence are processed by Clocked; Gemini receives text and evidence for rewriting. The generated research query is sent to Tavily. Text redaction happens after primary image transcription and does not redact the original screenshot before it reaches the image provider.

The interface supports deleting an analysis and requesting removal of its screenshot. This is not a guarantee of immediate erasure from provider logs or backups.

Transient Gemini failures receive bounded retries. Failed analyses offer a retry action; optional rewrite failures can still produce an evidence report. Provider outages, quotas, and missing or rejected sources can prevent completion or leave no reading links. Keep Exploring currently uses retrieved web publications, not a separate verified book catalog. Existing completed analyses are not automatically regenerated after server updates.

## Validation scope

The Clocked, resilience, and reading-list suites contain 17 automated tests covering mocked provider responses and application logic. They do not establish live provider availability. The latest reading-list revision was deployed and its live version checked, but a complete new screenshot-to-saved-recommendations run was not confirmed during that deployment session.

Built for the Clocked AI Build Challenge.
