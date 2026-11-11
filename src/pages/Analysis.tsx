import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAnalysis, deleteAnalysis, deleteScreenshot, updateExtractedText } from '@/lib/api';
import type { AnalysisRecord, RewriteMode } from '@/types';
import { StatusChip, ClaimTypeChip, EmptyState, formatDate } from '@/components/shared';
import {
  ChevronLeft, Share2, Copy, Check, BookOpen, Lightbulb, FileText, ExternalLink,
  Trash2, AlertCircle, ScanSearch, ImageIcon
} from 'lucide-react';

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'claims' | 'rewrite' | 'explore'>('overview');
  const [rewriteMode, setRewriteMode] = useState<RewriteMode>('factual');
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const data = await getAnalysis(id);
      if (data && data.status !== 'completed') {
        navigate(`/processing/${id}`, { replace: true });
        return;
      }
      setAnalysis(data);
      setLoading(false);
    })();
  }, [id, navigate]);

  const handleCopy = () => {
    if (!analysis) return;
    const text = rewriteMode === 'factual' ? analysis.factual_rewrite : analysis.exploratory_rewrite;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!analysis) return;
    const text = rewriteMode === 'factual' ? analysis.factual_rewrite : analysis.exploratory_rewrite;
    if (navigator.share && text) {
      try {
        await navigator.share({ title: analysis.title, text });
      } catch {}
    } else if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!analysis || !id) return;
    const deleted = await deleteAnalysis(id);
    if (!deleted) {
      setDeleteFailed(true);
      return;
    }
    if (analysis.image_path) await deleteScreenshot(analysis.image_path);
    navigate('/library');
  };

  if (loading) {
    return (
      <div className="pt-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-brass-300 border-t-brass-500 animate-spin" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="pt-16">
        <EmptyState
          icon={<AlertCircle size={28} />}
          title="Analysis not found"
          message="This analysis may have been deleted or never created."
          action={<button onClick={() => navigate('/')} className="btn-secondary">Go Home</button>}
        />
      </div>
    );
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'claims' as const, label: 'Claims' },
    { key: 'rewrite' as const, label: 'Rewrite' },
    { key: 'explore' as const, label: 'Keep Exploring' },
  ];

  return (
    <div className="pt-6 pb-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/library')} className="p-2 -ml-2 text-midnight-400 hover:text-midnight-600 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 -mr-2 text-midnight-300 hover:text-rust-500 transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {analysis.image_url && (
        <div className="mb-6 rounded-xl2 overflow-hidden border border-ivory-300">
          <img src={analysis.image_url} alt="Original screenshot" className="w-full h-auto" />
        </div>
      )}

      <h1 className="font-serif text-2xl text-midnight-700 leading-tight mb-1">{analysis.title}</h1>
      <p className="text-sm text-midnight-300 mb-1">{analysis.topic}</p>
      <p className="text-xs text-midnight-300/70 mb-6">{formatDate(analysis.created_at)}</p>

      <div className="flex gap-1 mb-6 border-b border-ivory-300 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
              activeTab === tab.key
                ? 'text-midnight-700'
                : 'text-midnight-300 hover:text-midnight-400'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brass-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fadeIn">
          {!!analysis.clocked_checks?.length && (
            <div className="card p-5">
              <h3 className="section-title mb-2">Research checks</h3>
              <p className="text-xs text-midnight-400 mb-3">Completed means the API returned a response. It does not certify source quality or establish truth.</p>
              <div className="space-y-2">
                {analysis.clocked_checks.map((check, index) => (
                  <div key={`${check.endpoint}-${index}`} className="text-sm text-midnight-500 border-b border-ivory-200 pb-2">
                    <span className="font-medium">{({ pii: 'Protect · contact data', injection: 'Guard · instructions', extract: 'Extract · claims', decide: 'Decide · risk', fill: 'Fill · research details', script: 'Inspect · code', rerank: 'Rerank · relevance', compare: 'Compare · sources', grounding: 'Verify · evidence' } as Record<string, string>)[check.endpoint] || check.endpoint}</span>
                    <span className="ml-2">{check.status}</span>
                    <p className="text-xs text-midnight-400 mt-1">{check.detail}</p>
                  </div>
                ))}
              </div>
              {!!analysis.research_notes?.redacted_items && <p className="text-xs mt-3">Contact or identifying details were removed from the research text. The original screenshot remains in your private library.</p>}
            </div>
          )}
          {analysis.concise_assessment && (
            <div className="card-elevated p-5">
              <h3 className="section-title mb-2">Assessment</h3>
              <p className="text-sm text-midnight-500 leading-relaxed">{analysis.concise_assessment}</p>
            </div>
          )}

          {analysis.summary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center">
                <p className="font-serif text-2xl text-teal-500">{analysis.summary.supported}</p>
                <p className="text-xs text-midnight-300 mt-1">Supported</p>
              </div>
              <div className="card p-4 text-center">
                <p className="font-serif text-2xl text-rust-500">{analysis.summary.contradicted}</p>
                <p className="text-xs text-midnight-300 mt-1">Contradicted</p>
              </div>
              <div className="card p-4 text-center">
                <p className="font-serif text-2xl text-brass-500">{analysis.summary.unresolved}</p>
                <p className="text-xs text-midnight-300 mt-1">Unresolved</p>
              </div>
            </div>
          )}

          {analysis.extracted_text && (
            <div className="card p-5">
              <h3 className="section-title mb-2">Extracted Text</h3>
              <p className="text-sm text-midnight-400 leading-relaxed whitespace-pre-wrap">
                {analysis.extracted_text_edited || analysis.extracted_text}
              </p>
            </div>
          )}

          <div className="card p-5 bg-brass-50/30 border-brass-200/40">
            <p className="text-sm text-midnight-400 leading-relaxed italic">
              Curilens preserves curiosity while improving accuracy. A claim unsupported by evidence is not necessarily false — it may simply be unresolved.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="space-y-4 animate-fadeIn">
          {analysis.claims.length === 0 ? (
            <EmptyState
              icon={<FileText size={28} />}
              title="No claims assessed"
              message="No individual claims were identified in this screenshot."
            />
          ) : (
            analysis.claims.map((claim, idx) => (
              <div key={claim.id} className="card-elevated p-5 animate-fadeIn" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="flex flex-wrap gap-2 mb-3">
                  <ClaimTypeChip type={claim.claim_type} />
                  <StatusChip status={claim.verification_status} />
                </div>
                <p className="font-serif text-base text-midnight-700 leading-snug mb-3">
                  "{claim.claim_text}"
                </p>
                <p className="text-sm text-midnight-400 leading-relaxed mb-3">
                  {claim.explanation}
                </p>
                {claim.evidence_summary && (
                  <div className="mb-3 px-3 py-2.5 rounded-lg bg-ivory-200/50">
                    <p className="text-xs font-medium text-midnight-400 mb-1">Evidence Summary</p>
                    <p className="text-sm text-midnight-500 leading-relaxed">{claim.evidence_summary}</p>
                  </div>
                )}
                {claim.uncertainty && (
                  <p className="text-xs text-brass-600 italic mb-3">
                    Uncertainty: {claim.uncertainty}
                  </p>
                )}
                {claim.sources.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-midnight-400">Sources</p>
                    {claim.sources.map((src) => (
                      <a
                        key={src.id}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg bg-ivory-50 border border-ivory-300 hover:border-brass-200 transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-midnight-600 truncate">{src.title}</p>
                            {src.author && <p className="text-xs text-midnight-300 mt-0.5">{src.author}</p>}
                            <p className="text-xs text-midnight-400 mt-1.5 leading-relaxed line-clamp-2">
                              "{src.passage}"
                            </p>
                          </div>
                          <ExternalLink size={14} className="text-midnight-300 group-hover:text-brass-400 flex-shrink-0 mt-1 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'rewrite' && (
        <div className="animate-fadeIn">
          <div className="flex gap-2 mb-5 p-1 rounded-full bg-ivory-200">
            <button
              onClick={() => setRewriteMode('factual')}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                rewriteMode === 'factual' ? 'bg-midnight-600 text-ivory-50 shadow-sm' : 'text-midnight-400'
              }`}
            >
              Factual
            </button>
            <button
              onClick={() => setRewriteMode('exploratory')}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                rewriteMode === 'exploratory' ? 'bg-midnight-600 text-ivory-50 shadow-sm' : 'text-midnight-400'
              }`}
            >
              Exploratory
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <button onClick={handleCopy} className="btn-secondary text-xs px-4 py-2">
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
            <button onClick={handleShare} className="btn-secondary text-xs px-4 py-2">
              <Share2 size={14} /> Share
            </button>
          </div>

          {rewriteMode === 'factual' ? (
            <div className="card-elevated p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} className="text-brass-500" />
                <h3 className="section-title">Factual Rewrite</h3>
              </div>
              {analysis.factual_rewrite ? (
                <p className="text-sm text-midnight-500 leading-relaxed whitespace-pre-wrap">
                  {analysis.factual_rewrite}
                </p>
              ) : (
                <p className="text-sm text-midnight-300 italic">Factual rewrite not available.</p>
              )}
            </div>
          ) : (
            <div className="card-elevated p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-brass-500" />
                <h3 className="section-title">Exploratory Rewrite</h3>
              </div>
              {analysis.exploratory_rewrite ? (
                <p className="text-sm text-midnight-500 leading-relaxed whitespace-pre-wrap">
                  {analysis.exploratory_rewrite}
                </p>
              ) : (
                <p className="text-sm text-midnight-300 italic">Exploratory rewrite not available.</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'explore' && (
        <div className="space-y-4 animate-fadeIn">
          {analysis.recommendations.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={28} />}
              title="No recommendations yet"
              message="Keep Exploring recommendations will appear here after analysis is complete."
            />
          ) : (
            <>
              <p className="text-sm text-midnight-400 leading-relaxed italic mb-4">
                Enter the rabbit hole. These carefully selected resources will help you go deeper into the topic — not endlessly, but meaningfully.
              </p>
              {analysis.recommendations.map((rec, idx) => (
                <a
                  key={rec.id}
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block card-elevated p-5 animate-fadeIn group"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h4 className="font-serif text-base font-medium text-midnight-700 leading-snug group-hover:text-brass-600 transition-colors">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-midnight-300 mt-0.5">
                        {rec.author}{rec.publication_info ? ` — ${rec.publication_info}` : ''}
                      </p>
                    </div>
                    <ExternalLink size={16} className="text-midnight-300 group-hover:text-brass-400 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                  <p className="text-sm text-midnight-400 leading-relaxed mt-2 mb-3">
                    {rec.relevance_explanation}
                  </p>
                  <StatusChip status={rec.classification} />
                </a>
              ))}
            </>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-900/40 backdrop-blur-sm animate-fadeInSlow px-6">
          <div className="bg-ivory-50 rounded-xl2 p-6 max-w-sm w-full animate-scaleIn">
            <h3 className="font-serif text-lg text-midnight-700 mb-2">Delete this analysis?</h3>
            <p className="text-sm text-midnight-300 mb-6">
              The screenshot, claims, sources, and recommendations will be permanently removed.
            </p>
            {deleteFailed && (
              <p className="text-sm text-rust-600 mb-4">Could not delete this analysis. Please try again.</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 px-6 py-3 rounded-full bg-rust-500 text-ivory-50 font-medium text-sm transition-all hover:bg-rust-600 active:scale-95">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
