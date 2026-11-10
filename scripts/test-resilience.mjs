import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../supabase/functions/analyze/resilience.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { retryTransient, evidenceOnlyResult } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
test('busy service is retried once, without changing model', async () => {
  let calls = 0;
  const result = await retryTransient(async () => { if (++calls === 1) throw { status: 503 }; return 'actual result'; }, async () => {});
  assert.equal(calls, 2); assert.equal(result, 'actual result');
});
test('authentication and invalid requests never retry; repeated quota errors stop', async () => {
  for (const status of [401, 404, 429]) {
    let calls = 0;
    await assert.rejects(retryTransient(async () => { calls++; throw Object.assign(new Error('failed'), { status }); }, async () => {}));
    assert.equal(calls, status === 429 ? 2 : 1);
  }
});
test('writing failure preserves supplied statuses and quotes without inventing recommendations', () => {
  const result = evidenceOnlyResult([
    { claim_text: 'A claim', verification_status: 'contradicted', sources: [{ title: 'Actual source', url: 'https://example.org', passage: 'Actual quotation.' }] },
    { claim_text: 'Another claim', verification_status: 'unresolved', sources: [] },
  ], 'History');
  assert.match(result.factual_rewrite, /contradicted/);
  assert.match(result.factual_rewrite, /Actual quotation/);
  assert.match(result.factual_rewrite, /unresolved/);
  assert.match(result.concise_assessment, /AI rewrites are unavailable/);
  assert.deepEqual(result.recommendations, []);
});
