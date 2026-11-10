// Request/response contracts: clocked-sdk 0.7.0 (Rezolve.ai).
export interface EvidenceDocument { id: string; title: string; url: string; text: string }
export interface ClockedRun {
  endpoint: string;
  status: 'completed' | 'failed' | 'skipped';
  detail: string;
}
type Json = Record<string, any>;
export function validatedVerdict(claim: string, result: Json, documents: EvidenceDocument[], conflicts: boolean, highStakes: boolean) {
  const row = Array.isArray(result?.claims) && result.claims.length === 1 ? result.claims[0] : null;
  const document = documents.find(d => d.id === row?.evidence?.document);
  const quote = row?.evidence?.quote;
  const valid = row?.claim === claim && document && typeof quote === 'string' && quote.trim() && document.text.includes(quote);
  const sources = valid ? [{ title: document.title, url: document.url, passage: quote, relevance: 'Passage returned by Clocked grounding' }] : [];
  const status = !valid || conflicts || highStakes ? 'unresolved'
    : row.verdict === 'supported' ? 'supported'
    : row.verdict === 'contradicted' ? 'contradicted'
    : row.verdict === 'not_stated' ? 'insufficient_evidence' : 'unresolved';
  return { verification_status: status, sources };
}
export class Clocked {
  readonly runs: ClockedRun[] = [];
  constructor(private key: string, private transport: typeof fetch = fetch) {}
  skip(endpoint: string, detail: string) {
    this.runs.push({ endpoint, status: 'skipped', detail });
  }
  async call(endpoint: string, body: Json): Promise<Json | null> {
    if (!this.key) { this.skip(endpoint, 'Clocked is not configured.'); return null; }
    try {
      const response = await this.transport(`https://clocked.rezolve.ai/clocked/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify(body), signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Invalid response');
      this.runs.push({ endpoint, status: 'completed', detail: 'Request completed.' });
      return result;
    } catch (error) {
      // Do not persist provider bodies, input text, or credentials.
      const detail = error instanceof Error && /^HTTP \d+$/.test(error.message) ? error.message : 'Request failed or timed out.';
      this.runs.push({ endpoint, status: 'failed', detail });
      return null;
    }
  }
  async guard(text: string): Promise<boolean> {
    const result = await this.call('injection', { text: text.slice(0, 20000), source: 'content', evidence: false });
    // Fail closed: unchecked external text must not enter later model prompts.
    return result?.verdict === 'benign';
  }
  async prepare(text: string) {
    if (!await this.guard(text)) throw new Error('Content could not pass the instruction-safety check. Try a different screenshot.');
    const privacy = await this.call('pii', {
      text, entities: ['email', 'phone', 'address', 'ssn', 'credit_card', 'bank_account', 'username'], anonymize: 'replace',
    });
    if (typeof privacy?.anonymized_text !== 'string') throw new Error('The privacy check could not finish. Please try again.');
    const safeText = privacy.anonymized_text;
    const extraction = await this.call('extract', {
      text: safeText,
      fields: { claims: { description: 'Individual factual assertions, copied verbatim. Exclude instructions, opinions and metaphors.', list: true, max_items: 5 } },
    });
    const values = extraction?.fields?.claims?.value;
    const claims = Array.isArray(values)
      ? [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0 && safeText.includes(value)))].slice(0, 5)
      : [];
    if (!Array.isArray(values)) throw new Error('Claim extraction could not finish. Please try again.');
    const decision = await this.call('decide', {
      state: safeText,
      questions: { risk: { type: 'choice', criteria: {
        high_stakes: 'Medical, legal, financial, or immediate physical safety advice.',
        general: 'General educational claims without consequential personal advice.',
      } } },
    });
    const risk = decision?.answers?.risk?.choice === 'general' ? 'general' : 'high_stakes';
    const metadata = await this.call('fill', {
      text: safeText,
      fields: {
        topic: { type: 'generate', description: 'A short subject category for organizing this investigation.', max_tokens: 30 },
        search_query: { type: 'generate', description: 'A concise neutral search query for evidence about the main factual claim. Do not include personal contact details.', max_tokens: 70 },
        code: { type: 'extract', infer: false, description: 'Executable code or terminal commands quoted in the screenshot; null if none.' },
      },
    });
    const code = metadata?.fields?.code?.value;
    let scriptWarning = '';
    if (typeof code === 'string' && code.trim() && safeText.includes(code)) {
      const inspection = await this.call('script', { script: code, evidence: false });
      scriptWarning = inspection?.verdict === 'benign'
        ? 'Code was inspected; this does not guarantee it is safe to execute.'
        : 'Code safety could not be established. Do not run the pictured commands.';
    } else this.skip('script', 'No executable code was found in this screenshot.');
    return {
      safeText, claims: claims.map(claim_text => ({ claim_text })), risk, scriptWarning,
      topic: typeof metadata?.fields?.topic?.value === 'string' ? metadata.fields.topic.value : '',
      query: typeof metadata?.fields?.search_query?.value === 'string' ? metadata.fields.search_query.value : claims[0] || '',
      privacyCount: Array.isArray(privacy.entities) ? privacy.entities.length : 0,
    };
  }
  async select(claim: string, documents: EvidenceDocument[]): Promise<{ documents: EvidenceDocument[]; conflicts: boolean }> {
    if (!documents.length) {
      this.skip('rerank', 'No retrieved source text.');
      this.skip('compare', 'No retrieved source text.');
      return { documents: [], conflicts: false };
    }
    const ranked = await this.call('rerank', {
      query: claim.slice(0, 4000), documents: documents.map(({ id, text }) => ({ id, text })), top_n: 3,
      instructions: 'Select passages relevant to assessing this exact claim, including contradicting evidence. Relevance does not establish source authority.',
    });
    const ids = Array.isArray(ranked?.results)
      ? ranked.results.filter((r: Json) => r.action === 'use' && typeof r.id === 'string').map((r: Json) => r.id) : [];
    let selected = ids.map((id: string) => documents.find(d => d.id === id)).filter((d: EvidenceDocument | undefined): d is EvidenceDocument => !!d);
    let conflicts = false;
    if (selected.length >= 2) {
      const compared = await this.call('compare', { documents: selected.map(({ id, text }: EvidenceDocument) => ({ id, text })), evidence: 'all' });
      if (!compared || !Array.isArray(compared.conflicts) || !Array.isArray(compared.documents)) return { documents: [], conflicts: false };
      conflicts = compared.conflicts.length > 0;
      // Keep the first copy of duplicate documents; never count copies as independent corroboration.
      const kept: string[] = [];
      selected = selected.filter((d: EvidenceDocument) => {
        const row = compared.documents.find((v: Json) => v.id === d.id);
        if (Array.isArray(row?.duplicates) && row.duplicates.some((id: string) => kept.includes(id))) return false;
        kept.push(d.id); return true;
      });
    } else this.skip('compare', 'Fewer than two relevant source documents.');
    return { documents: selected, conflicts };
  }
}

// Tavily returns actual extracted page text. No generated answer is used as evidence.
// No arbitrary URL fetching: this avoids exposing the server to user-supplied internal URLs.
export async function retrieveEvidence(query: string, key: string, transport: typeof fetch = fetch): Promise<EvidenceDocument[]> {
  if (!key || !query.trim()) return [];
  const response = await transport('https://api.tavily.com/search', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query.slice(0, 400), max_results: 5, search_depth: 'advanced', include_raw_content: true, include_answer: false }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Evidence retrieval failed.');
  const data = await response.json();
  const seen = new Set<string>();
  return (Array.isArray(data.results) ? data.results : []).flatMap((r: Json, i: number) => {
    try {
      const url = new URL(r.url);
      if (url.protocol !== 'https:' || url.username || url.password || seen.has(url.href) || typeof r.raw_content !== 'string' || r.raw_content.trim().length < 100) return [];
      seen.add(url.href);
      return [{ id: `source-${i}`, title: typeof r.title === 'string' ? r.title : url.hostname, url: url.href, text: r.raw_content.slice(0, 12000) }];
    } catch { return []; }
  });
}
