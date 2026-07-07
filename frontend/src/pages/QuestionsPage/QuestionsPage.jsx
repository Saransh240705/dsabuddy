import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar, Footer } from '@/components/layout';
import { Seo } from '@/components/common';
import { breadcrumbSchema } from '@/config/seo';
import { questionService } from '@/api/services/questionService';
import { useUserStore } from '@/store/useUserStore';
import { PLATFORM_LABELS } from '@/config/constants';
import { PLATFORMS as PLATFORM_ICONS } from '@/utils';
import { Search, ChevronLeft, ChevronRight, Circle, CheckCircle2 } from 'lucide-react';
import {
  DifficultyBadge,
  TagPill,
} from './components';

const PAGE_SIZE = 50;

const DIFFICULTY_FILTER_CLASSES = {
  '':       'bg-violet-500/15 text-violet-400 border-violet-500/35',
  EASY:     'bg-green-500/10 text-green-500 border-green-500/25',
  MEDIUM:   'bg-yellow-500/10 text-yellow-500 border-yellow-500/25',
  HARD:     'bg-red-500/10 text-red-500 border-red-500/25',
};

const ROW_GRID = 'grid grid-cols-[24px_1fr_70px] md:grid-cols-[24px_1fr_110px_120px_100px]';

export default function QuestionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useUserStore((s) => s.user);

  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters from URL
  const q          = searchParams.get('q') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const tag        = searchParams.get('tag') || '';
  const page       = Number(searchParams.get('page') || 1);

  // Local search input (debounced into URL)
  const [searchInput, setSearchInput] = useState(q);
  const debounceRef = useRef(null);

  const setParam = useCallback((key, val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val) next.set(key, val); else next.delete(key);
      next.delete('page'); // reset page on filter change
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Debounce search input → URL
  useEffect(() => {
    if (searchInput.trim() === q.trim()) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParam('q', searchInput.trim());
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, q, setParam]);

  // Sync search input with URL search param only when they differ (trimmed)
  useEffect(() => {
    if (searchInput.trim() !== q.trim()) {
      setSearchInput(q);
    }
  }, [q]);

  // Fetch questions
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    questionService.list({
      q: q || undefined,
      difficulty: difficulty || undefined,
      tag: tag || undefined,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    })
      .then(data => {
        if (cancelled) return;
        setQuestions(data.questions || []);
        setTotal(data.pagination?.total || 0);
      })
      .catch(err => {
        if (!cancelled) setError(err?.response?.data?.error || 'Failed to load questions.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, difficulty, tag, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goPage = (p) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Seo
        title="DSA Questions Bank"
        description="Browse and filter thousands of DSA questions from LeetCode, Codeforces, CodeChef and GFG. Filter by difficulty, topic, and company."
        path="/questions"
        jsonLd={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Questions', path: '/questions' },
        ])}
      />
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pb-16 pt-[120px]">

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2.5 text-[clamp(28px,4vw,40px)] font-extrabold tracking-tight">
            Questions Bank
          </h1>
          <p className="m-0 text-[15px] text-slate-400">
            {total > 0 ? `${total.toLocaleString()} questions` : 'Browse questions'} from LeetCode, Codeforces, CodeChef & GFG
          </p>
        </div>

        {/* Filters bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] max-w-[420px] flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search questions…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full rounded-[10px] border border-[#1e1e3a] bg-[#0f0f1a] py-2.5 pl-10 pr-3.5 text-sm text-white outline-none transition-colors focus:border-violet-600"
            />
          </div>

          {/* Difficulty filter */}
          {['', 'EASY', 'MEDIUM', 'HARD'].map(d => (
            <button
              key={d}
              onClick={() => setParam('difficulty', d)}
              className={`rounded-[10px] border px-4.5 py-2 text-[13px] font-semibold transition-all ${
                difficulty === d
                  ? DIFFICULTY_FILTER_CLASSES[d]
                  : 'border-[#1e1e3a] bg-transparent text-slate-500'
              }`}
            >
              {d || 'All'}
            </button>
          ))}

          {/* Active Tag filter */}
          {tag && (
            <div className="inline-flex items-center gap-1.5 rounded-[10px] border border-violet-500/30 bg-violet-500/15 px-3.5 py-2 text-[13px] font-semibold text-violet-400">
              <span>Tag: {tag}</span>
              <button
                onClick={() => setParam('tag', '')}
                className="ml-1 inline-flex items-center border-none bg-transparent p-0 text-base font-bold text-violet-400"
              >
                ×
              </button>
            </div>
          )}

          {/* Total count chip */}
          {!loading && (
            <span className="ml-auto text-[13px] text-slate-600">
              Page {page} of {totalPages}
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[#1a1a2e] bg-[#0a0a14]">
          {/* Table header */}
          <div className={`${ROW_GRID} border-b border-[#1a1a2e] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600`}>
            <span />
            <span>Title</span>
            <span className="text-right">Difficulty</span>
            <span className="hidden md:block">Platform</span>
            <span className="hidden md:block">Acceptance</span>
          </div>

          {/* Loading skeleton */}
          {loading && Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`${ROW_GRID} items-center gap-2 border-b border-[#111120] px-5 py-3.5`}>
              <div className="h-5 w-5 animate-pulse rounded-full bg-[#1a1a2e]" />
              <div className="h-4 w-[70%] animate-pulse rounded bg-[#1a1a2e]" />
              <div className="ml-auto h-4 w-14 animate-pulse rounded bg-[#1a1a2e]" />
              <div className="hidden h-4 w-20 animate-pulse rounded bg-[#1a1a2e] md:block" />
              <div className="hidden h-4 w-12 animate-pulse rounded bg-[#1a1a2e] md:block" />
            </div>
          ))}

          {/* Rows */}
          {!loading && questions.map((q) => {
            const tags = q.tags || [];
            const platform = q.sourcePlatform;
            const platformKey = platform?.toLowerCase();
            const platformInfo = PLATFORM_ICONS[platformKey];
            const PlatformIconComponent = platformInfo?.Icon;
            const acceptancePct = q.acceptanceRate != null
              ? `${(q.acceptanceRate * (q.acceptanceRate > 1 ? 1 : 100)).toFixed(1)}%`
              : '—';
            const solved = q.userStatuses?.[0]?.status === 'SOLVED';

            return (
              <div
                key={q.id}
                onClick={() => navigate(`/questions/${q.id}`)}
                className={`${ROW_GRID} cursor-pointer items-center border-b border-[#111120] px-5 py-3.5 transition-colors hover:bg-[#0d0d1f]`}
              >
                {/* Checklist */}
                <div className="flex items-center">
                  {solved
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <Circle className="h-5 w-5 text-slate-700" />
                  }
                </div>

                {/* Title + tags */}
                <div className="min-w-0">
                  <div className={`truncate text-sm font-semibold text-slate-200 ${tags.length ? 'mb-1.5' : ''}`}>
                    {q.displayName || q.title}
                    {q.paidOnly && (
                      <span className="ml-2 text-[10px] font-bold text-yellow-500">
                        💰 PAID
                      </span>
                    )}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 2).map(t => <TagPill key={t} name={t} />)}
                      {tags.length > 2 && (
                        <span className="self-center text-[11px] text-slate-600">
                          +{tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Difficulty */}
                <div className="text-right"><DifficultyBadge difficulty={q.difficulty} /></div>

                {/* Platform */}
                <div className="hidden items-center md:flex">
                  {PlatformIconComponent ? (
                    <span style={{ color: platformInfo.color }} title={platformInfo.name}>
                      <PlatformIconComponent className="h-5 w-5" />
                    </span>
                  ) : (
                    <span className="text-[13px] text-slate-500">
                      {PLATFORM_LABELS[platform] || platform || '—'}
                    </span>
                  )}
                </div>

                {/* Acceptance */}
                <span className="hidden text-[13px] text-slate-500 md:block">{acceptancePct}</span>
              </div>
            );
          })}

          {/* Empty state */}
          {!loading && questions.length === 0 && (
            <div className="px-5 py-20 text-center text-[15px] text-slate-700">
              <div className="mb-4 text-5xl">🔍</div>
              No questions found. Try adjusting your filters.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <PaginationButton disabled={page <= 1} onClick={() => goPage(page - 1)}>
              <ChevronLeft size={16} /> Prev
            </PaginationButton>

            {paginationRange(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} className="px-1 text-slate-700">…</span>
              ) : (
                <PaginationButton key={p} active={p === page} onClick={() => goPage(p)}>
                  {p}
                </PaginationButton>
              )
            )}

            <PaginationButton disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
              Next <ChevronRight size={16} />
            </PaginationButton>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function PaginationButton({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-[10px] border px-3.5 py-2 text-[13px] font-semibold transition-all ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
      } ${
        active
          ? 'border-violet-600 bg-violet-600 text-white'
          : disabled
            ? 'border-[#1a1a2e] text-slate-800'
            : 'border-[#1a1a2e] text-slate-400'
      }`}
    >
      {children}
    </button>
  );
}

function paginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', total);
  } else if (current >= total - 3) {
    pages.push(1, '…', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '…', current - 1, current, current + 1, '…', total);
  }
  return pages;
}
