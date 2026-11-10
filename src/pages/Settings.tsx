import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  Shield, Database, ScanText, Search, BadgeCheck, PenLine,
  CheckCircle2, AlertCircle, AlertTriangle, Lock, Eye, Trash2, ExternalLink
} from 'lucide-react';

export default function Settings() {
  const [dbConnected] = useState(isSupabaseConfigured);

  const services = [
    { key: 'database', label: 'Database & Storage', icon: Database, description: 'Supabase PostgreSQL + secure screenshot storage' },
    { key: 'ocr', label: 'Text Extraction (Gemini Vision)', icon: ScanText, description: 'Google Gemini multimodal OCR for screenshot text' },
    { key: 'research', label: 'Claim Identification (Gemini)', icon: Search, description: 'Gemini-powered claim extraction and categorization' },
    { key: 'clocked', label: 'Clocked AI Verification', icon: BadgeCheck, description: 'Independent claim verification via Clocked API' },
    { key: 'rewrite', label: 'Rewrite Engine (Gemini)', icon: PenLine, description: 'Gemini-powered factual and exploratory rewrites' },
  ];

  const [statuses, setStatuses] = useState<Record<string, 'connected' | 'not_configured' | 'unknown' | string>>({
    database: dbConnected ? 'connected' : 'not_configured',
    ocr: 'unknown',
    research: 'unknown',
    clocked: 'unknown',
    rewrite: 'unknown',
    geminiModel: 'gemini-2.5-flash',
  });

  useEffect(() => {
    const checkEdgeStatus = async () => {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!baseUrl) return;

      try {
        const response = await fetch(`${baseUrl}/functions/v1/analyze`, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStatuses({
            database: dbConnected ? 'connected' : 'not_configured',
            ocr: data.ocr ? 'connected' : 'not_configured',
            research: data.research ? 'connected' : 'not_configured',
            clocked: data.clocked ? 'connected' : 'not_configured',
            rewrite: data.rewrite ? 'connected' : 'not_configured',
            geminiModel: data.geminiModel || 'gemini-2.5-flash',
          });
        } else {
          setStatuses((prev) => ({
            ...prev,
            ocr: 'not_configured',
            research: 'not_configured',
            clocked: 'not_configured',
            rewrite: 'not_configured',
          }));
        }
      } catch {
        setStatuses((prev) => ({
          ...prev,
          ocr: 'not_configured',
          research: 'not_configured',
          clocked: 'not_configured',
          rewrite: 'not_configured',
        }));
      }
    };

    checkEdgeStatus();
  }, [dbConnected]);

  return (
    <div className="pt-12 pb-8 animate-fadeIn">
      <h1 className="font-serif text-2xl text-midnight-700 mb-1">Settings</h1>
      <p className="text-sm text-midnight-300 mb-8">API connections and privacy controls</p>

      <section className="mb-8">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Shield size={18} className="text-brass-500" />
          Service Status
        </h2>
        <div className="space-y-2.5">
          {services.map((svc) => {
            const status = statuses[svc.key];
            const Icon = svc.icon;
            return (
              <div key={svc.key} className="card-elevated p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ivory-200 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-midnight-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-midnight-600">{svc.label}</p>
                      {status === 'connected' ? (
                        <span className="chip chip-supports text-[10px] py-0.5">
                          <CheckCircle2 size={11} /> Connected
                        </span>
                      ) : status === 'not_configured' ? (
                        <span className="chip chip-contradicts text-[10px] py-0.5">
                          <AlertCircle size={11} /> Not Configured
                        </span>
                      ) : (
                        <span className="chip chip-unresolved text-[10px] py-0.5">
                          <AlertTriangle size={11} /> Checking
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-midnight-300 mt-1 leading-relaxed">{svc.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {(statuses.geminiModel as string) && statuses.ocr === 'connected' && (
          <div className="mt-4 px-4 py-3 rounded-xl2 bg-brass-50/40 border border-brass-200/40 flex items-center gap-2">
            <span className="text-xs font-mono text-brass-600">gemini:</span>
            <span className="text-xs text-midnight-500">{statuses.geminiModel}</span>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Lock size={18} className="text-brass-500" />
          Privacy
        </h2>
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Eye size={18} className="text-midnight-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-midnight-600">Private analysis records</p>
              <p className="text-xs text-midnight-300 mt-1 leading-relaxed">
                Screenshots are stored securely and never displayed publicly. There is no public gallery.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-midnight-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-midnight-600">No unnecessary data sharing</p>
              <p className="text-xs text-midnight-300 mt-1 leading-relaxed">
                Screenshot contents are only sent to the services needed for analysis: Gemini for text extraction and rewrites, and Clocked for claim verification.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trash2 size={18} className="text-midnight-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-midnight-600">Delete anytime</p>
              <p className="text-xs text-midnight-300 mt-1 leading-relaxed">
                You can delete any analysis from its detail page. The screenshot, claims, sources, and recommendations are permanently removed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="section-title mb-4">Environment Variables</h2>
        <div className="card p-5">
          <p className="text-xs text-midnight-300 leading-relaxed mb-4">
            The following environment variables configure the app. Secret keys are stored as Supabase Edge Function secrets and never exposed in frontend code. Optional variables fall back to built-in defaults.
          </p>
          <div className="space-y-2.5">
            {[
              { name: 'VITE_SUPABASE_URL', desc: 'Supabase project URL', public: true },
              { name: 'VITE_SUPABASE_ANON_KEY', desc: 'Supabase anonymous key', public: true },
              { name: 'GEMINI_API_KEY', desc: 'Google Gemini API key (OCR, claims, rewrites)', public: false },
              { name: 'GEMINI_MODEL', desc: 'Optional. Overrides the Gemini model (default: gemini-2.5-flash)', public: false, optional: true },
              { name: 'CLOCKED_API_KEY', desc: 'Clocked AI verification API key', public: false },
            ].map((env) => (
              <div key={env.name} className="flex items-center justify-between gap-2 py-1.5">
                <div>
                  <code className="text-xs font-mono text-midnight-500">{env.name}</code>
                  <p className="text-xs text-midnight-300 mt-0.5">{env.desc}</p>
                </div>
                <span className={`chip text-[10px] py-0.5 flex-shrink-0 ${
                  env.public ? 'bg-ivory-200 text-midnight-400' : 'bg-brass-100 text-brass-600'
                }`}>
                  {env.optional ? 'Optional' : env.public ? 'Public' : 'Secret'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="text-center py-6">
        <p className="font-serif text-sm text-midnight-400">Curilens</p>
        <p className="text-xs text-midnight-300 mt-1">Look closer. Learn deeper.</p>
        <p className="text-xs text-midnight-300/60 mt-2">
          Built for the Clocked AI Build Challenge
        </p>
      </div>
    </div>
  );
}
