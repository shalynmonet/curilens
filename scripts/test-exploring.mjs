import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../supabase/functions/analyze/exploring.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { buildReadingList } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const docs = [{ title: 'Actual publication title', url: 'https://example.org/article' }];
test('unresolved claims still get related reading without a model response', () => {
  const result = buildReadingList(docs, [{ verification_status: 'unresolved', sources: [] }], []);
  assert.equal(result.length, 1);
  assert.equal(result[0].classification, 'explores');
  assert.match(result[0].relevance_explanation, /not been established as evidence/);
});
test('a title variation does not discard a real source or invent metadata', () => {
  const result = buildReadingList(docs, [], [{ title: 'Changed title', url: docs[0].url, author: 'Invented author' }]);
  assert.equal(result[0].title, docs[0].title);
  assert.equal(result[0].author, '');
});
test('only actual retrieved publications become reading links', () => {
  assert.deepEqual(buildReadingList([], [], [{ title: 'Invented book', url: 'https://example.com/fake' }]), []);
});
test('evidence status determines labels, never generated support claims', () => {
  assert.equal(buildReadingList(docs, [], [{ url: docs[0].url, classification: 'supports' }])[0].classification, 'explores');
  const checked = [{ verification_status: 'contradicted', sources: [{ url: docs[0].url }] }];
  assert.equal(buildReadingList(docs, checked, [])[0].classification, 'challenges');
});
test('unsafe links and duplicate fragments are rejected', () => {
  assert.equal(buildReadingList([...docs, { ...docs[0], url: docs[0].url + '#section' }, { title: 'Bad', url: 'javascript:alert(1)' }], [], []).length, 1);
});
