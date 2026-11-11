# Clocked expansion: deployment and demo checks

This branch implements all nine endpoint roles. It is **not deployed or live-provider tested** by Codex. The original pipeline remains on main until this branch is merged. Do not select all nine in the submission merely because this code exists.

## Activate in Bolt

1. Import/merge this branch's changes into the latest working project; preserve any newer Bolt edits. Apply `supabase/migrations/20261111000100_clocked_checks.sql` once. It adds two columns and a trigger without changing owner access policies.
2. Set `TAVILY_API_KEY` in server secrets. Keep existing `CLOCKED_API_KEY` and `GEMINI_API_KEY` there. Never put them in Vite variables or GitHub. Tavily Search can incur separate charges: verify its current allowance and spending settings before testing. This branch issues one advanced search per screenshot.
3. Redeploy **analyze**, including `clocked.ts`, then publish the frontend. No share-function change is required.
4. Test with an educational screenshot containing several factual statements. Open Overview → Research checks. Inspect each response status and the actual source quotations under Claims.
5. Test a screenshot containing a real terminal command to exercise Inspect. Code is inspected but never executed. Compare requires at least two relevant passages; a skipped Compare or Inspect is expected when their input is absent.
6. Test a screenshot with contact details and another with embedded instructions. Contact data should be removed from the research text; instruction-screening failures stop the pipeline. The private original image is not redacted. Gemini OCR and Clocked's privacy service receive the original content before textual redaction.
7. Test missing retrieval credentials, no results, provider failure, conflicting sources, and high-stakes claims. These must not become supported verdicts. High-stakes topics deliberately require expert review and stay unresolved.

## Endpoint roles

| Form label | API path | Effect |
|---|---|---|
| Guard | injection | Rejects unsafe/unchecked screenshot or retrieved instructions before downstream prompts |
| Protect | pii | Redacts contact/account identifiers before research and rewriting |
| Extract | extract | Extracts up to five verbatim claims; rejects values absent from the text |
| Decide | decide | Routes high-stakes topics to expert review rather than automatic verdicts |
| Fill | fill | Produces the topic, neutral search query, and verbatim code field |
| Inspect | script | Inspects pictured commands and adds a warning; conditional on code |
| Rerank | rerank | Selects passages relevant to each claim, including contradictory evidence |
| Compare | compare | Removes duplicate documents and flags source conflicts before verification |
| Verify | grounding | Checks an explicit claim against selected passages; accepts only matching claims and quotations present in the source |

Request formats checked against Rezolve.ai's published `clocked-sdk@0.7.0` README and TypeScript declarations. Automated tests use mock responses, not actual Clocked credentials.

## Limits to communicate honestly

- Search relevance and agreement do not establish source authority. This branch is not a complete source-quality certification system. Users must inspect the linked documents. Conflicts and high-stakes findings remain unresolved.
- Missing/failed evidence retrieval produces no synthetic evidence. Generated summaries are never supplied as source documents. Recommendations are restricted to retrieved titles and URLs; books are not invented to fill an empty list.
- All additional calls consume credits and add latency. The code bounds claims to five and results to five, processes calls sequentially to avoid account concurrency limits, and sets per-call timeouts. Test total latency against your deployed function's execution limit before recording. There is no automatic retry after ambiguous failures, avoiding unintended repeat billing.
- Research checks record HTTP completion, failure, or a skipped step. A completed request alone does not prove the verdict is correct; inspect its effect on the result. No provider payloads or secret values are saved in this execution record.
- This branch also binds the requested screenshot path to its analysis before service-role storage access.

## Local checks

`npm run typecheck`, `npm run build`, and `node --test scripts/test-clocked.mjs`.

Server: `deno check --node-modules-dir=auto supabase/functions/analyze/index.ts`.

Live checklist: record a real returned result for every endpoint claimed in the entry. Include a code screenshot and multiple relevant evidence documents when demonstrating Inspect and Compare.
