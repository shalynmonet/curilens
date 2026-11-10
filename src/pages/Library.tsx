import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAnalyses } from '@/lib/api';
import type { AnalysisRecord } from '@/types';
import { EmptyState, formatDate } from '@/components/shared';
import { Search, Library as LibraryIcon, ImageIcon, X } from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    (async () => {
      const data = await getAllAnalyses();
      setAnalyses(data);
      setLoading(false);
    })();
  }, []);

  const topics = useMemo(() => {
    const set = new Set<string>();
    analyses.forEach((a) => { if (a.topic) set.add(a.topic); });
    return Array.from(set).sort();
  }, [analyses]);

  const filtered = useMemo(() => {
    return analyses.filter((a) => {
      if (filter !== 'all' && a.topic !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.topic.toLowerCase().includes(q) ||
          (a.concise_assessment || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analyses, search, filter]);

  if (loading) {
    return (
      <div className="pt-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-brass-300 border-t-brass-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-12 pb-8 animate-fadeIn">
      <h1 className="font-serif text-2xl text-midnight-700 mb-1">Library</h1>
      <p className="text-sm text-midnight-300 mb-6">
        {analyses.length} saved {analyses.length === 1 ? 'investigation' : 'investigations'}
      </p>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-midnight-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search investigations..."
          className="input-field pl-11 pr-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-300 hover:text-midnight-500 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {topics.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === 'all' ? 'bg-midnight-600 text-ivory-50' : 'bg-ivory-200 text-midnight-400 hover:bg-ivory-300'
            }`}
          >
            All
          </button>
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setFilter(topic)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === topic ? 'bg-midnight-600 text-ivory-50' : 'bg-ivory-200 text-midnight-400 hover:bg-ivory-300'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<LibraryIcon size={28} />}
          title={search || filter !== 'all' ? "No matches found" : "Your library is empty"}
          message={search || filter !== 'all' ? "Try a different search or filter." : "Upload a screenshot from the Home tab to start your first investigation."}
          action={analyses.length === 0 ? <button onClick={() => navigate('/')} className="btn-secondary">Go to Home</button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a, idx) => (
            <button
              key={a.id}
              onClick={() => navigate(a.status === 'completed' ? `/analysis/${a.id}` : `/processing/${a.id}`)}
              className="w-full flex items-center gap-4 p-3.5 card-elevated text-left animate-fadeIn"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-ivory-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {a.image_url ? (
                  <img src={a.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={22} className="text-midnight-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm font-medium text-midnight-600 truncate">{a.title}</p>
                <p className="text-xs text-midnight-300 truncate mt-0.5">
                  {a.topic || a.status}
                </p>
                {a.summary && a.status === 'completed' && (
                  <div className="flex gap-3 mt-1.5 text-xs">
                    {a.summary.supported > 0 && <span className="text-teal-500">{a.summary.supported} supported</span>}
                    {a.summary.contradicted > 0 && <span className="text-rust-500">{a.summary.contradicted} contradicted</span>}
                    {a.summary.unresolved > 0 && <span className="text-brass-500">{a.summary.unresolved} unresolved</span>}
                  </div>
                )}
              </div>
              <span className="text-xs text-midnight-300 flex-shrink-0">
                {formatDate(a.created_at)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
