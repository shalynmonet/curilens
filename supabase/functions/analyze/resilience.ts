export function isHardQuota(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message || '');
  return status === 429 && /per.?day|daily|billing|limit:\s*0\b/i.test(message);
}

export async function retryTransient<T>(operation: () => Promise<T>, wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await operation(); } catch (error) {
      const status = (error as { status?: number })?.status;
      if (attempt >= 2 || isHardQuota(error) || (status !== 429 && status !== 503)) throw error;
      await wait(1500 * 2 ** attempt + Math.floor(Math.random() * 250));
    }
  }
}

export interface CheckedClaim {
  claim_text: string;
  verification_status: string;
  sources: { title: string; url: string; passage: string }[];
}

// Preserve actual verification output when the optional writing service is unavailable.
// No model knowledge, invented evidence, or substituted verdicts enter this fallback.
export function evidenceOnlyResult(claims: CheckedClaim[], topic: string) {
  const description = 'The writing service could not finish. The evidence checks below are available, but AI rewrites are unavailable for this attempt.';
  const report = claims.map(c => `Claim: ${c.claim_text}\nEvidence status: ${c.verification_status}\n${c.sources.map(s => `${s.title}: “${s.passage}”\n${s.url}`).join('\n') || 'No supporting or contradicting passage was established.'}`).join('\n\n');
  return {
    title: 'Screenshot evidence review', topic: topic || 'Investigation', concise_assessment: description,
    claims: claims.map((c, claim_index) => ({
      claim_index, claim_text: c.claim_text, claim_type: 'factual',
      explanation: `Evidence status: ${c.verification_status}. This describes the supplied sources, not a guarantee of truth.`,
      evidence_summary: c.sources.map(s => s.passage).join('\n') || 'No checked source passage is available.',
      uncertainty: 'AI interpretation is unavailable. Review the original sources and their limitations.',
    })),
    factual_rewrite: `AI rewrite unavailable. Evidence report:\n\n${report || 'No assessable factual claims were extracted.'}`,
    exploratory_rewrite: 'AI exploratory rewrite unavailable. Review the extracted claims and linked source passages to continue investigating.',
    recommendations: [],
  };
}
