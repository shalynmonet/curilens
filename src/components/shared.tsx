import { type ReactNode } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export function StageIcon({ status }: { status: 'pending' | 'active' | 'done' | 'error' }) {
  if (status === 'done') return <Check size={18} className="text-teal-500" strokeWidth={2.5} />;
  if (status === 'error') return <AlertCircle size={18} className="text-rust-500" strokeWidth={2.5} />;
  if (status === 'active') return <Loader2 size={18} className="text-brass-400 animate-spin" />;
  return <div className="w-2.5 h-2.5 rounded-full bg-ivory-400" />;
}

export function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    supported: 'chip-supports',
    contradicted: 'chip-contradicts',
    unresolved: 'chip-unresolved',
    insufficient_evidence: 'chip-unresolved',
    supports: 'chip-supports',
    challenges: 'chip-contradicts',
    contextualizes: 'chip-contextualizes',
    explores: 'chip-explores',
  };

  const labels: Record<string, string> = {
    supported: 'Supported',
    contradicted: 'Contradicted',
    unresolved: 'Unresolved',
    insufficient_evidence: 'Insufficient Evidence',
    supports: 'Supports',
    challenges: 'Challenges',
    contextualizes: 'Contextualizes',
    explores: 'Explores',
  };

  return (
    <span className={`chip ${styles[status] || 'chip-unresolved'}`}>
      {labels[status] || status}
    </span>
  );
}

export function ClaimTypeChip({ type }: { type: string }) {
  const labels: Record<string, string> = {
    factual: 'Factual Claim',
    opinion: 'Opinion',
    metaphor: 'Metaphor',
    philosophical: 'Philosophical',
    prediction: 'Prediction',
    unverifiable: 'Unverifiable',
  };

  return (
    <span className="chip bg-ivory-200 text-midnight-400">
      {labels[type] || type}
    </span>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-full bg-ivory-200 flex items-center justify-center mb-4 text-midnight-300">
        {icon}
      </div>
      <h3 className="font-serif text-lg text-midnight-600 mb-1.5">{title}</h3>
      <p className="text-sm text-midnight-300 max-w-xs leading-relaxed">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
