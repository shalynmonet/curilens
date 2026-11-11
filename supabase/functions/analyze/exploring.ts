interface ReadingSource { title: string; url: string }
interface CheckedClaim { verification_status: string; sources: { url: string }[] }

function canonicalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}

// A reading list is distinct from proof. Keep real retrieved publications even
// when Verify is inconclusive or the optional writing service fails.
export function buildReadingList(documents: ReadingSource[], claims: CheckedClaim[], generated: unknown) {
  const suggestions = Array.isArray(generated) ? generated : [];
  const seen = new Set<string>();
  return documents.flatMap(document => {
    const url = canonicalUrl(document.url);
    if (!url || !document.title?.trim() || seen.has(url)) return [];
    seen.add(url);
    const statuses = new Set(claims.filter(c => c.sources.some(s => canonicalUrl(s.url) === url)).map(c => c.verification_status));
    const supports = statuses.has('supported');
    const challenges = statuses.has('contradicted');
    const classification = supports && challenges ? 'contextualizes' : supports ? 'supports' : challenges ? 'challenges' : 'explores';
    const suggestion = suggestions.find(s => s && canonicalUrl(s.url) === url);
    const explanation = classification === 'explores'
      ? 'Found for this investigation as further reading. This link has not been established as evidence supporting or contradicting the claim.'
      : typeof suggestion?.relevance_explanation === 'string' && suggestion.relevance_explanation.trim()
        ? suggestion.relevance_explanation.slice(0, 600)
        : 'This source contains a passage used in the evidence checks. Open the original publication to review its context.';
    return [{
      title: document.title.trim(), url,
      author: '', publication_info: new URL(url).hostname,
      relevance_explanation: explanation, classification,
    }];
  }).slice(0, 5);
}
