import { useCallback, useEffect, useState } from 'react';
import { Copy, Check, KeyRound, Trash2, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface IntakeConnection {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const SHARE_ENDPOINT = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share`
  : '';

const SHORTCUT_STEPS = [
  'Create a new Shortcut in the Shortcuts app and name it Send to Curilens.',
  'Turn on "Show in Share Sheet" and set the accepted types to Images.',
  'Add "Get Contents of URL". Set the address to the endpoint shown above and the method to POST.',
  'Under Headers, add a header named X-Curilens-Token with your connection token as the value.',
  'Under Request Body, choose Form and add a field named image. Set its value to Shortcut Input.',
  'Add "Get Dictionary Value" and use the key analysisId from the response.',
  'Add "Open URL" and build the address from your Curilens site address, then /analysis/, then the analysisId.',
];

export default function ShareSetup() {
  const [connections, setConnections] = useState<IntakeConnection[]>([]);
  const [label, setLabel] = useState('iPhone');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    if (!supabase) return;
    const { data, error: loadError } = await supabase
      .from('intake_tokens')
      .select('id, label, created_at, last_used_at, revoked_at')
      .order('created_at', { ascending: false });
    if (loadError) {
      console.error('Load connections error:', loadError.message);
      setError('Could not load your connections. Please try again.');
    } else {
      setConnections(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleCreate = async () => {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { data, error: createError } = await supabase.rpc('create_intake_token', {
      p_label: label.trim() || 'iPhone',
    });
    setBusy(false);
    if (createError || typeof data !== 'string') {
      console.error('Create connection error:', createError?.message);
      setError('Could not create a connection. Please try again.');
      return;
    }
    setNewToken(data);
    setCopied(false);
    loadConnections();
  };

  const handleRevoke = async (id: string) => {
    if (!supabase) return;
    const { error: revokeError } = await supabase
      .from('intake_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);
    if (revokeError) {
      setError('Could not revoke that connection. Please try again.');
      return;
    }
    loadConnections();
  };

  const handleCopy = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
  };

  const activeCount = connections.filter((c) => !c.revoked_at).length;

  return (
    <div className="pt-8 pb-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-midnight-700 leading-tight">iPhone Shortcut</h1>
        <p className="mt-3 text-midnight-500 leading-relaxed">
          Send screenshots from your iPhone straight to your account. Each connection has its own token that you can revoke at any time.
        </p>
      </header>

      {!isSupabaseConfigured && (
        <p className="text-red-700">The connection service is not configured yet.</p>
      )}

      <section className="rounded-2xl border border-midnight-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-midnight-700">Create a connection</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={label}
            maxLength={60}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 rounded-xl border border-midnight-200 px-4 py-3 text-midnight-700 outline-none focus:border-midnight-700"
            placeholder="Name this device"
          />
          <button
            onClick={handleCreate}
            disabled={busy || !isSupabaseConfigured}
            className="rounded-xl bg-midnight-700 text-ivory-50 px-5 py-3 font-medium hover:bg-midnight-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
            Create token
          </button>
        </div>

        {newToken && (
          <div className="rounded-xl bg-ivory-100 border border-midnight-200 p-4 space-y-3">
            <p className="text-sm font-medium text-midnight-700">Copy this token now. It will not be shown again.</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 break-all text-sm text-midnight-700">{newToken}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg border border-midnight-200 bg-white p-2 hover:bg-ivory-200 transition-colors"
                aria-label="Copy token"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-midnight-700">Your connections</h2>
        {loading ? (
          <p className="text-midnight-400">Loading...</p>
        ) : connections.length === 0 ? (
          <p className="text-midnight-400">No connections yet.</p>
        ) : (
          <ul className="space-y-2">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 rounded-xl border border-midnight-200 bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-midnight-700 truncate">{c.label}</p>
                  <p className="text-sm text-midnight-400">
                    {c.revoked_at
                      ? 'Revoked'
                      : c.last_used_at
                        ? `Last used ${new Date(c.last_used_at).toLocaleDateString()}`
                        : 'Never used'}
                  </p>
                </div>
                {!c.revoked_at && (
                  <button
                    onClick={() => handleRevoke(c.id)}
                    className="shrink-0 rounded-lg p-2 text-midnight-400 hover:text-rust-600 hover:bg-rust-50 transition-colors"
                    aria-label={`Revoke ${c.label}`}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-midnight-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-midnight-700">Set up the Shortcut</h2>
        <p className="text-sm text-midnight-500">
          Endpoint: <code className="break-all text-midnight-700">{SHARE_ENDPOINT || 'Not configured'}</code>
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-midnight-600 leading-relaxed">
          {SHORTCUT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-sm text-midnight-400">
          {activeCount > 0
            ? `You have ${activeCount} active connection${activeCount === 1 ? '' : 's'}.`
            : 'Create a connection above before setting up the Shortcut.'}
        </p>
      </section>
    </div>
  );
}
