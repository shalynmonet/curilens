import { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Loader2, AlertCircle, ScanSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import HoundstoothBar from '@/components/HoundstoothBar';
import { uploadScreenshot, createAnalysis, submitForAnalysis, getRecentAnalyses } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { EmptyState } from '@/components/shared';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const recent = await getRecentAnalyses(3);
      setRecentAnalyses(recent);
    })();
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|heic|heif)$/i)) {
      setError('Please upload a PNG, JPEG, or WebP screenshot.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Screenshot is too large. Maximum size is 10MB.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Database is not connected. Please check your configuration.');
      return;
    }

    setIsUploading(true);

    try {
      const uploaded = await uploadScreenshot(file);
      if (!uploaded) {
        setError('Could not store the screenshot. Please try again.');
        setIsUploading(false);
        return;
      }

      const analysisId = await createAnalysis(uploaded.path);
      if (!analysisId) {
        setError('Could not create the analysis record. Please try again.');
        setIsUploading(false);
        return;
      }

      await submitForAnalysis(analysisId, uploaded.path);
      navigate(`/processing/${analysisId}`);
    } catch (err) {
      setError('Something went wrong while starting the analysis.');
      setIsUploading(false);
    }
  }, [navigate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="pt-12 pb-8 animate-fadeIn">
      <header className="mb-4">
        <Logo />
      </header>
      <HoundstoothBar className="mb-10" />

      <section className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass-100/60 text-brass-600 text-xs font-medium tracking-wide mb-5 animate-fadeInSlow">
          <ScanSearch size={14} />
          Screenshot your curiosity
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-midnight-700 leading-tight text-balance mb-3">
          Look closer.<br />
          <span className="text-brass-500">Learn deeper.</span>
        </h1>
        <p className="text-midnight-300 text-sm leading-relaxed max-w-sm mx-auto">
          Share a screenshot of an intriguing claim. Curilens extracts the text, finds credible evidence, verifies what's real, and helps you explore further.
        </p>
      </section>

      <section
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-brass-400 bg-brass-50/50 scale-[1.02]'
            : 'border-ivory-400 bg-ivory-100/50 hover:border-brass-300 hover:bg-ivory-100'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {isUploading ? (
            <>
              <Loader2 size={40} className="text-brass-400 animate-spin mb-4" />
              <p className="font-serif text-lg text-midnight-600">Starting analysis...</p>
              <p className="text-sm text-midnight-300 mt-1">Uploading and preparing your screenshot</p>
            </>
          ) : (
            <>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                isDragging ? 'bg-brass-200 text-midnight-600 scale-110' : 'bg-ivory-200 text-midnight-400'
              }`}>
                <Upload size={28} strokeWidth={1.8} />
              </div>
              <p className="font-serif text-lg text-midnight-600 mb-1">
                {isDragging ? 'Drop to analyze' : 'Upload a screenshot'}
              </p>
              <p className="text-sm text-midnight-300">
                Tap to select or drag an image here
              </p>
              <p className="text-xs text-midnight-300/70 mt-3">
                PNG, JPEG, or WebP — up to 10MB
              </p>
            </>
          )}
        </div>
      </section>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl2 bg-rust-50 border border-rust-200 animate-scaleIn">
          <AlertCircle size={18} className="text-rust-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rust-600">{error}</p>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl2 bg-brass-50 border border-brass-200 animate-fadeIn">
          <AlertCircle size={18} className="text-brass-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brass-700">
            Database not connected. Add Supabase credentials to enable screenshot analysis.
          </p>
        </div>
      )}

      {recentAnalyses.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Investigations</h2>
          </div>
          <div className="space-y-3">
            {recentAnalyses.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(a.status === 'completed' ? `/analysis/${a.id}` : `/processing/${a.id}`)}
                className="w-full flex items-center gap-4 p-3.5 card-elevated text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-ivory-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {a.image_url ? (
                    <img src={a.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-midnight-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm font-medium text-midnight-600 truncate">
                    {a.title || 'Processing...'}
                  </p>
                  <p className="text-xs text-midnight-300 truncate">
                    {a.topic || a.status}
                  </p>
                </div>
                <span className="text-xs text-midnight-300 flex-shrink-0">
                  {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {recentAnalyses.length === 0 && isSupabaseConfigured && !isUploading && (
        <section className="mt-12">
          <EmptyState
            icon={<ScanSearch size={28} strokeWidth={1.5} />}
            title="No investigations yet"
            message="Upload a screenshot above to begin your first curiosity-driven analysis."
          />
        </section>
      )}
    </div>
  );
}
