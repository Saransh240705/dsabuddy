import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar, Footer } from '@/components/layout';
import { Seo } from '@/components/common';
import { breadcrumbSchema } from '@/config/seo';
import { questionService } from '@/api/services/questionService';
import { useUserStore } from '@/store/useUserStore';
import { STATUS_COLORS, STATUS_OPTIONS } from '@/config/constants';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import {
  DifficultyBadge,
  DifficultyBadgeLarge,
  Section,
} from './components';

export default function QuestionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const currentStatus = question?.userStatuses?.[0]?.status || null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    questionService.getById(id)
      .then(data => {
        if (!cancelled) setQuestion(data.question);
      })
      .catch(err => {
        if (!cancelled) setError(err?.response?.data?.error || 'Question not found.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleSetStatus = async (status) => {
    if (!user) return navigate('/login');
    setStatusLoading(true);
    try {
      await questionService.setStatus(id, status === currentStatus ? null : status);
      // Re-fetch to get updated status
      const data = await questionService.getById(id);
      setQuestion(data.question);
    } catch (e) {
      console.error(e);
    } finally {
      setStatusLoading(false);
    }
  };

  const externalUrl = question?.sourceUrl || question?.leetcodeUrl;
  const tags = question?.tags || [];
  const companies = question?.companies || [];
  const related = [
    ...(question?.relatedFrom?.map(r => r.to) || []),
    ...(question?.relatedTo?.map(r => r.from) || []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Seo
        title={question ? question.displayName || question.title : 'Question'}
        description={question ? `Solve ${question.title} on DSABuddy. Difficulty: ${question.difficulty}. Platform: ${question.sourcePlatform || 'LeetCode'}.` : ''}
        path={`/questions/${id}`}
        jsonLd={question ? breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Questions', path: '/questions' },
          { name: question.displayName || question.title, path: `/questions/${id}` },
        ]) : undefined}
      />
      <Navbar />

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-12 pt-[100px] sm:px-6 sm:pt-[120px] sm:pb-16">

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="mb-7 inline-flex items-center gap-1.5 border-none bg-none py-1 text-sm font-medium text-slate-500 transition-colors hover:text-violet-400"
        >
          <ChevronLeft size={16} strokeWidth={2.5} /> Back to Questions
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[240, 32, 180, 120].map((w, i) => (
              <div
                key={i}
                className="max-w-full animate-pulse rounded-lg bg-[#0f0f1a]"
                style={{ height: i === 0 ? '40px' : '20px', width: `${w}px` }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
            {error}
          </div>
        )}

        {/* Content */}
        {question && !loading && (
          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1fr_300px]">

            {/* Left — main content */}
            <div>
              {/* Title row */}
              <div className="mb-5 flex flex-wrap items-start gap-3.5">
                <h1 className="m-0 flex-1 text-[clamp(22px,3.5vw,32px)] font-extrabold leading-tight tracking-tight">
                  {question.displayName || question.title}
                </h1>
                <DifficultyBadgeLarge difficulty={question.difficulty} />
              </div>

              {/* Meta row */}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                {question.sourcePlatform && (
                  <span className="text-[13px] text-slate-500">
                    {question.sourcePlatform}
                    {question.sourceId && ` #${question.sourceId}`}
                  </span>
                )}
                {question.acceptanceRate != null && (
                  <span className="text-[13px] text-slate-500">
                    Acceptance: <span className="text-slate-400">
                      {(question.acceptanceRate * (question.acceptanceRate > 1 ? 1 : 100)).toFixed(1)}%
                    </span>
                  </span>
                )}
                {question.sourceRating && (
                  <span className="text-[13px] text-slate-500">
                    Rating: <span className="text-slate-400">{question.sourceRating}</span>
                  </span>
                )}
                {question.paidOnly && (
                  <span className="text-xs font-bold text-yellow-500">💰 Premium</span>
                )}
                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[13px] font-semibold text-violet-600 no-underline transition-colors hover:bg-violet-500/20"
                  >
                    Solve Now <ExternalLink size={14} />
                  </a>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mb-7 flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <Link
                      key={t}
                      to={`/questions?tag=${encodeURIComponent(t)}`}
                      className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400 no-underline transition-colors hover:bg-violet-500/20"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              )}

              {/* Problem statement */}
              {question.statement && (
                <Section title="Problem Statement">
                  <div
                    className="whitespace-pre-wrap text-[15px] leading-[1.75] text-slate-300"
                    dangerouslySetInnerHTML={{ __html: question.statement }}
                  />
                </Section>
              )}

              {/* Examples */}
              {question.examples && (
                <Section title="Examples">
                  {(Array.isArray(question.examples) ? question.examples : [question.examples]).map((ex, i) => (
                    <div
                      key={i}
                      className="mb-3 whitespace-pre-wrap rounded-[10px] border border-[#1a1a2e] bg-[#0a0a14] px-[18px] py-4 font-mono text-[13px] text-slate-400"
                    >
                      <span className="mb-2 block text-[11px] font-bold tracking-wider text-slate-500">
                        EXAMPLE {i + 1}
                      </span>
                      {typeof ex === 'string' ? ex : JSON.stringify(ex, null, 2)}
                    </div>
                  ))}
                </Section>
              )}

              {/* Constraints */}
              {question.constraints && (
                <Section title="Constraints">
                  <div className="whitespace-pre-wrap rounded-[10px] border border-[#1a1a2e] bg-[#0a0a14] px-[18px] py-4 font-mono text-[13px] text-slate-400">
                    {typeof question.constraints === 'string'
                      ? question.constraints
                      : JSON.stringify(question.constraints, null, 2)}
                  </div>
                </Section>
              )}

              {/* Related questions */}
              {related.length > 0 && (
                <Section title="Related Questions">
                  <div className="flex flex-col gap-2">
                    {related.map(r => (
                      <Link
                        key={r.id}
                        to={`/questions/${r.id}`}
                        className="flex items-center gap-3 rounded-[10px] border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 no-underline transition-colors hover:border-violet-600"
                      >
                        <DifficultyBadge difficulty={r.difficulty} />
                        <span className="text-sm font-medium text-slate-200">{r.title}</span>
                      </Link>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            {/* Right sidebar */}
            <div className="static top-[100px] lg:sticky">

              {/* Mark status */}
              <div className="mb-5 rounded-2xl border border-[#1a1a2e] bg-[#0a0a14] p-5">
                <p className="m-0 mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  My Status
                </p>
                <div className="flex flex-col gap-2">
                  {STATUS_OPTIONS.map(s => {
                    const c = STATUS_COLORS[s];
                    const isActive = currentStatus === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleSetStatus(s)}
                        disabled={statusLoading || !user}
                        className="flex w-full items-center gap-2 rounded-[10px] border px-4 py-2.5 text-left text-[13px] font-bold transition-colors disabled:cursor-not-allowed"
                        style={{
                          cursor: statusLoading || !user ? 'not-allowed' : 'pointer',
                          borderColor: isActive ? c.border : '#1e1e3a',
                          background: isActive ? c.bg : 'transparent',
                          color: isActive ? c.text : '#475569',
                          opacity: statusLoading ? 0.6 : 1,
                        }}
                      >
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ background: isActive ? c.text : '#1e293b' }}
                        />
                        {s}
                      </button>
                    );
                  })}
                  {!user && (
                    <p className="m-0 mt-1 text-center text-xs text-slate-700">
                      <Link to="/login" className="text-violet-600">Log in</Link> to track your progress
                    </p>
                  )}
                </div>
              </div>

              {/* Companies */}
              {companies.length > 0 && (
                <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a14] p-5">
                  <p className="m-0 mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Asked By
                  </p>
                  <div className="flex flex-col gap-2">
                    {companies.map(({ company, frequency }) => (
                      <Link
                        key={company.id}
                        to={`/dashboard/pyqs/${company.slug}`}
                        className="flex items-center justify-between rounded-lg border border-[#1a1a2e] bg-[#0d0d1f] px-3 py-2.5 no-underline transition-colors hover:border-violet-600"
                      >
                        <span className="text-[13px] font-semibold text-slate-300">
                          {company.name}
                        </span>
                        {frequency && (
                          <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-violet-600">
                            {frequency}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
