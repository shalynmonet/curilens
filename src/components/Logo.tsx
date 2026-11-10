import { Link } from 'react-router-dom';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
  }[size];

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="relative" style={{ width: dims.icon, height: dims.icon }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-midnight-600 transition-all duration-500 group-hover:stroke-midnight-500"
          />
          <circle
            cx="50" cy="50" r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-brass-400 transition-all duration-500 group-hover:text-brass-300"
            strokeDasharray="200"
            style={{ strokeDashoffset: 0 }}
          />
          <circle cx="50" cy="50" r="14" fill="currentColor" className="text-brass-400 opacity-85 transition-all duration-500 group-hover:opacity-100" />
          <line x1="50" y1="8" x2="50" y2="22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-midnight-600" />
          <line x1="50" y1="78" x2="50" y2="92" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-midnight-600" />
        </svg>
      </div>
      <span className={`font-serif font-medium tracking-tight text-midnight-700 ${dims.text}`}>
        Curilens
      </span>
    </Link>
  );
}
