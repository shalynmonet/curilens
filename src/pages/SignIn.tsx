import { useState, type FormEvent } from 'react';
import { Mail, Loader2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function SignIn() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('sending');
    const { ok } = await sendMagicLink(trimmed);
    setStatus(ok ? 'sent' : 'error');
  };

  return (
    <div className="pt-16 pb-8">
      <div className="w-12 h-12 rounded-2xl bg-midnight-700 text-ivory-50 flex items-center justify-center mb-6">
        <Lock size={22} />
      </div>
      <h1 className="text-3xl font-semibold text-midnight-700 leading-tight">Sign in to Curilens</h1>
      <p className="mt-3 text-midnight-500 leading-relaxed">
        Your screenshots and analyses are private to your account. We will email you a one-time sign-in link.
      </p>

      {status === 'sent' ? (
        <div className="mt-8 rounded-2xl border border-midnight-200 bg-white p-6">
          <p className="font-medium text-midnight-700">Check your inbox</p>
          <p className="mt-2 text-midnight-500">Open the link we sent to {email.trim()} on this device to continue.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-midnight-600">Email address</span>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-midnight-200 bg-white px-4 py-3 focus-within:border-midnight-700">
              <Mail size={18} className="text-midnight-300" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-midnight-700"
                placeholder="you@example.com"
              />
            </div>
          </label>
          {status === 'error' && (
            <p className="text-sm text-rust-600">We could not send the link. Check the address and try again.</p>
          )}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full rounded-xl bg-midnight-700 text-ivory-50 py-3 font-medium hover:bg-midnight-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status === 'sending' && <Loader2 size={18} className="animate-spin" />}
            Send sign-in link
          </button>
        </form>
      )}

      <Link to="/sample" className="mt-8 block text-center text-sm text-midnight-500 underline underline-offset-4 hover:text-midnight-700">
        See a sample analysis first
      </Link>
    </div>
  );
}
