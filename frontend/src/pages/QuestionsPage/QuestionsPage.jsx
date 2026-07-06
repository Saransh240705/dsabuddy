import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar, Footer } from '@/components/layout';
import { Seo } from '@/components/common';
import { breadcrumbSchema } from '@/config/seo';
import { questionService } from '@/api/services/questionService';
import { useUserStore } from '@/store/useUserStore';
import { DIFFICULTY_COLORS, PLATFORM_LABELS } from '@/config/constants';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DifficultyBadge,
  StatusBadge,
  TagPill,
} from './components';

const PAGE_SIZE = 50;

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
    <div style={{ minHeight: '100vh', background: '#000000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
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

      <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', padding: '120px 24px 64px', width: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Questions Bank
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
            {total > 0 ? `${total.toLocaleString()} questions` : 'Browse questions'} from LeetCode, Codeforces, CodeChef & GFG
          </p>
        </div>

        {/* Filters bar */}
        <div style={{
          display: 'flex', gap: '12px', marginBottom: '24px',
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '420px' }}>
            <span style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: '#64748b', pointerEvents: 'none',
            }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search questions…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{
                width: '100%', background: '#0f0f1a', border: '1px solid #1e1e3a',
                borderRadius: '10px', padding: '10px 14px 10px 40px', color: '#fff',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#1e1e3a'}
            />
          </div>

          {/* Difficulty filter */}
          {['', 'EASY', 'MEDIUM', 'HARD'].map(d => (
            <button
              key={d}
              onClick={() => setParam('difficulty', d)}
              style={{
                padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                background: difficulty === d
                  ? (d ? DIFFICULTY_COLORS[d].bg : 'rgba(124,58,237,0.15)')
                  : 'transparent',
                color: difficulty === d
                  ? (d ? DIFFICULTY_COLORS[d].text : '#a78bfa')
                  : '#64748b',
                borderColor: difficulty === d
                  ? (d ? DIFFICULTY_COLORS[d].border : 'rgba(124,58,237,0.35)')
                  : '#1e1e3a',
              }}
            >
              {d || 'All'}
            </button>
          ))}

          {/* Active Tag filter */}
          {tag && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '10px', padding: '9px 14px', color: '#a78bfa',
              fontSize: '13px', fontWeight: 600,
            }}>
              <span>Tag: {tag}</span>
              <button
                onClick={() => setParam('tag', '')}
                style={{
                  background: 'none', border: 'none', color: '#a78bfa',
                  cursor: 'pointer', padding: 0, display: 'inline-flex',
                  alignItems: 'center', fontSize: '16px', fontWeight: 'bold',
                  marginLeft: '4px',
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Total count chip */}
          {!loading && (
            <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '13px' }}>
              Page {page} of {totalPages}
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px', padding: '16px 20px', color: '#fca5a5', marginBottom: '24px',
          }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div style={{
          background: '#0a0a14', border: '1px solid #1a1a2e',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr 110px 120px 100px 80px',
            padding: '12px 20px', borderBottom: '1px solid #1a1a2e',
            color: '#475569', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            <span>#</span>
            <span>Title</span>
            <span>Difficulty</span>
            <span>Platform</span>
            <span>Acceptance</span>
            <span style={{ textAlign: 'right' }}>Status</span>
          </div>

          {/* Loading skeleton */}
          {loading && Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '48px 1fr 110px 120px 100px 80px',
              padding: '14px 20px', borderBottom: '1px solid #111120',
              alignItems: 'center', gap: '8px',
            }}>
              <div style={{ height: '16px', width: '28px', background: '#1a1a2e', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '16px', width: '70%', background: '#1a1a2e', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '22px', width: '64px', background: '#1a1a2e', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '16px', width: '80px', background: '#1a1a2e', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '16px', width: '48px', background: '#1a1a2e', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '22px', width: '60px', background: '#1a1a2e', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite', marginLeft: 'auto' }} />
            </div>
          ))}

          {/* Rows */}
          {!loading && questions.map((q, idx) => {
            const userStatus = q.userStatuses?.[0]?.status || null;
            const tags = q.tags || [];
            const platform = q.sourcePlatform;
            const acceptancePct = q.acceptanceRate != null
              ? `${(q.acceptanceRate * (q.acceptanceRate > 1 ? 1 : 100)).toFixed(1)}%`
              : '—';
            const rowNum = (page - 1) * PAGE_SIZE + idx + 1;

            return (
              <div
                key={q.id}
                onClick={() => navigate(`/questions/${q.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr 110px 120px 100px 80px',
                  padding: '14px 20px', borderBottom: '1px solid #111120',
                  alignItems: 'center', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#0d0d1f'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* # */}
                <span style={{ color: '#334155', fontSize: '13px' }}>{rowNum}</span>

                {/* Title + tags */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: '14px', color: '#e2e8f0',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: tags.length ? '5px' : 0,
                  }}>
                    {q.displayName || q.title}
                    {q.paidOnly && (
                      <span style={{ marginLeft: '8px', fontSize: '10px', color: '#eab308', fontWeight: 700 }}>
                        💰 PAID
                      </span>
                    )}
                  </div>
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {tags.slice(0, 3).map(t => <TagPill key={t} name={t} />)}
                      {tags.length > 3 && (
                        <span style={{ fontSize: '11px', color: '#475569', alignSelf: 'center' }}>
                          +{tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Difficulty */}
                <div><DifficultyBadge difficulty={q.difficulty} /></div>

                {/* Platform */}
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                  {PLATFORM_LABELS[platform] || platform || '—'}
                </span>

                {/* Acceptance */}
                <span style={{ color: '#64748b', fontSize: '13px' }}>{acceptancePct}</span>

                {/* Status */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {userStatus
                    ? <StatusBadge status={userStatus} />
                    : <span style={{ color: '#1e293b', fontSize: '12px' }}>—</span>
                  }
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {!loading && questions.length === 0 && (
            <div style={{
              padding: '80px 20px', textAlign: 'center',
              color: '#334155', fontSize: '15px',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              No questions found. Try adjusting your filters.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: '8px', marginTop: '32px', flexWrap: 'wrap',
          }}>
            <PaginationButton disabled={page <= 1} onClick={() => goPage(page - 1)}>
              <ChevronLeft size={16} /> Prev
            </PaginationButton>

            {paginationRange(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} style={{ color: '#334155', padding: '0 4px' }}>…</span>
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function PaginationButton({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1px solid',
        background: active ? '#7c3aed' : 'transparent',
        color: active ? '#fff' : disabled ? '#1e293b' : '#94a3b8',
        borderColor: active ? '#7c3aed' : '#1a1a2e',
        transition: 'all 0.15s',
        opacity: disabled ? 0.4 : 1,
      }}
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
