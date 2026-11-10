import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAnalysis } from '@/lib/api';
import type { AnalysisRecord, PipelineStage } from '@/types';
import { StageIcon } from '@/components/shared';
import { AlertCircle, ArrowRight, CheckCircle2, Edit3 } from 'lucide-react';

const STAGES: { key: string; label: string; description: string }[] = [
  { key: 'extracting', label: 'Extracting Text', description: 'Reading the screenshot with OCR vision processing' },
  { key: 'identifying', label: 'Identifying Claims', description: 'Separating factual assertions from opinions and speculation' },
  { key: 'researching', label: 'Researching Evidence', description: 'Retrieving credible sources and primary research' },
  { key: 'verifying', label: 'Verifying with Clocked', description: 'Cross-referencing claims against evidence using Clocked AI' },
  { key: 'rewriting', label: 'Rewriting & Curating', description: 'Generating factual and exploratory rewrites, curating recommendations' },
];

const STATUS_TO_STAGE: Record<string, number> = {
  pending: -1,
  extracting: 0,
  identifying: 1,
  researching: 2,
  verifying: 3,
  rewriting: 4,
  completed: 5,
  error: -1,
};

export default function Processing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [editText, setEditText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAnalysis = useCallback(async () => {
    if (!id) return;
    const data = await getAnalysis(id);
    if (data) {
      setAnalysis(data);
      if (data.extracted_text && !editText) {
        setEditText(data.extracted_text_edited || data.extracted_text);
      }
      if (data.status === 'completed') {
        setTimeout(() => navigate(`/analysis/${id}`), 800);
        return false;
      }
      if (data.status === 'error') {
        setLoading(false);
        return false;
      }
      return true;
    }
    setLoading(false);
    return true;
  }, [id, navigate, editText]);

  useEffect(() => {
    let active = true;
    let pollTimer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (!active) return;
      const shouldContinue = await fetchAnalysis();
      if (shouldContinue && active) {
        pollTimer = setTimeout(poll, 3000);
      }
    };

    poll();

    return () => {
      active = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [fetchAnalysis]);

  const currentStageIdx = analysis ? STATUS_TO_STAGE[analysis.status] ?? -1 : -1;

  const stages: PipelineStage[] = STAGES.map((s, idx) => ({
    key: s.key as any,
    label: s.label,
    description: s.description,
    status: analysis?.status === 'error'
      ? 'error'
      : idx < currentStageIdx
        ? 'done'
        : idx === currentStageIdx
          ? 'active'
          : 'pending',
  }));

  if (loading && !analysis) {
    return (
      <div className="pt-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-brass-300 border-t-brass-500 animate-spin" />
        <p className="mt-4 text-sm text-midnight-300">Connecting...</p>
      </div>
    );
  }

  if (analysis?.status === 'error') {
    return (
      <div className="pt-16 px-2 animate-fadeIn">
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-16 h-16 rounded-full bg-rust-100 flex items-center justify-center mb-5">
            <AlertCircle size={32} className="text-rust-500" />
          </div>
          <h1 className="font-serif text-2xl text-midnight-700 mb-2">Analysis Failed</h1>
          <p className="text-sm text-midnight-300 max-w-sm leading-relaxed mb-6">
            {analysis.error_message || 'An error occurred during the analysis pipeline. This may be due to a missing API configuration.'}
          </p>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-8 animate-fadeIn">
      <h1 className="font-serif text-2xl text-midnight-700 text-center mb-2">Analyzing</h1>
      <p className="text-sm text-midnight-300 text-center mb-8">
        Looking closer at your screenshot...
      </p>

      {analysis?.image_url && (
        <div className="mb-8 rounded-xl2 overflow-hidden border border-ivory-300 max-w-[200px] mx-auto">
          <img src={analysis.image_url} alt="Screenshot being analyzed" className="w-full h-auto" />
        </div>
      )}

      <div className="space-y-1 mb-8">
        {stages.map((stage, idx) => (
          <div
            key={stage.key}
            className={`flex items-start gap-4 p-3.5 rounded-xl2 transition-all duration-500 ${
              stage.status === 'active' ? 'bg-brass-50/60 border border-brass-200' : ''
            }`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex-shrink-0 mt-0.5">
              <StageIcon status={stage.status} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                stage.status === 'done' ? 'text-midnight-500' :
                stage.status === 'active' ? 'text-midnight-700' :
                'text-midnight-300'
              }`}>
                {stage.label}
              </p>
              <p className={`text-xs mt-0.5 ${
                stage.status === 'active' ? 'text-midnight-400' : 'text-midnight-300/70'
              }`}>
                {stage.description}
              </p>
              {stage.status === 'active' && (
                <div className="mt-2 h-1 rounded-full bg-ivory-200 overflow-hidden">
                  <div className="h-full w-1/3 bg-brass-400 rounded-full animate-shimmer shimmer-bg" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {analysis?.extracted_text && currentStageIdx >= 1 && (
        <div className="card p-5 mb-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-midnight-600">Extracted Text</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-brass-500 hover:text-brass-600 flex items-center gap-1 transition-colors"
            >
              <Edit3 size={12} />
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </div>
          {isEditing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 rounded-lg bg-ivory-50 border border-ivory-300 text-sm text-midnight-700 focus:outline-none focus:border-brass-300 resize-none"
              rows={6}
            />
          ) : (
            <p className="text-sm text-midnight-400 leading-relaxed whitespace-pre-wrap">
              {editText || analysis.extracted_text}
            </p>
          )}
          {isEditing && (
            <p className="text-xs text-midnight-300 mt-2">
              Correct any OCR errors. Changes will be used for the rest of the analysis.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-midnight-300">
        <CheckCircle2 size={14} className="text-teal-400" />
        You'll be redirected automatically when the analysis is ready
      </div>
    </div>
  );
}
