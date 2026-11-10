import { Link } from 'react-router-dom';
import { ScanSearch, BadgeCheck, CircleHelp, ArrowRight } from 'lucide-react';
import { StatusChip, ClaimTypeChip } from '@/components/shared';

const sampleClaims = [
  {
    text: 'The screenshot says a city council approved a new bike lane budget in March.',
    type: 'factual',
    status: 'supported',
    explanation: 'The supplied article names the vote and the month. The sample is illustrative only.',
  },
  {
    text: 'The post claims the lane will cut commute times in half.',
    type: 'prediction',
    status: 'unresolved',
    explanation: 'No supplied source measures commute change, so the claim is unresolved rather than false.',
  },
  {
    text: 'The caption calls the project the most important decision of the decade.',
    type: 'opinion',
    status: 'contextualizes',
    explanation: 'This is a value judgment. It is noted for context and not checked for truth.',
  },
];

export default function Sample() {
  return (
    <div className="pt-12 pb-10 animate-fadeIn">
      <section className="text-center mb-10">
        <div className="mx-auto w-14 h-14 rounded-full bg-brass-100 flex items-center justify-center mb-5">
          <ScanSearch size={26} className="text-brass-600" />
        </div>
        <h1 className="font-serif text-3xl text-midnight-700 leading-tight mb-3">
          Look closer. Learn deeper.
        </h1>
        <p className="text-sm text-midnight-400 leading-relaxed max-w-sm mx-auto">
          Curilens reads a screenshot, separates its claims, and checks each one against the sources you can see.
        </p>
        <Link to="/sign-in" className="btn-primary mt-7">
          Sign in to start <ArrowRight size={16} />
        </Link>
      </section>

      <div className="mb-3 px-4 py-2.5 rounded-full bg-brass-50 border border-brass-200 text-center">
        <p className="text-xs font-medium text-brass-700">Sample — not a real analysis</p>
      </div>

      <article className="card-elevated p-5 space-y-5">
        <div>
          <p className="text-xs text-midnight-300 uppercase tracking-wide mb-1">Example screenshot</p>
          <h2 className="font-serif text-xl text-midnight-700 leading-snug">Bike lane budget post</h2>
          <p className="text-xs text-midnight-300 mt-1">Illustrative content written for this page</p>
        </div>

        <div className="space-y-4">
          {sampleClaims.map((claim) => (
            <div key={claim.text} className="p-4 rounded-xl bg-ivory-200/50 border border-ivory-300/60">
              <div className="flex flex-wrap gap-2 mb-2.5">
                <ClaimTypeChip type={claim.type} />
                <StatusChip status={claim.status} />
              </div>
              <p className="font-serif text-sm text-midnight-700 leading-snug mb-2">"{claim.text}"</p>
              <p className="text-xs text-midnight-400 leading-relaxed">{claim.explanation}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 items-start text-xs text-midnight-400 leading-relaxed">
          <CircleHelp size={16} className="text-midnight-300 flex-shrink-0 mt-0.5" />
          <p>
            Curilens judges claims only against the sources it has. A claim with no supporting source is marked unresolved, not false.
          </p>
        </div>
      </article>

      <section className="mt-8 grid grid-cols-1 gap-3">
        <div className="card p-4 flex gap-3 items-start">
          <BadgeCheck size={18} className="text-teal-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-midnight-500 leading-relaxed">
            Verdicts come from the sources in your analysis, and every verdict links back to the passage it used.
          </p>
        </div>
      </section>
    </div>
  );
}
