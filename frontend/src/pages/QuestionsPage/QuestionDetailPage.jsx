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
    <div style={{ minHeight: '100vh', background: '#000000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
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

      <main style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', padding: '120px 24px 64px', width: '100%' }}>

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#64748b', fontSize: '14px', fontWeight: 500, background: 'none',
            border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: '28px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <ChevronLeft size={16} strokeWidth={2.5} /> Back to Questions
        </button>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[240, 32, 180, 120].map((w, i) => (
              <div key={i} style={{ height: i === 0 ? '40px' : '20px', width: `${w}px`, maxWidth: '100%', background: '#0f0f1a', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px', padding: '24px', color: '#fca5a5', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Content */}
        {question && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '28px', alignItems: 'start' }}>

            {/* Left — main content */}
            <div>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800, margin: 0, flex: 1, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                  {question.displayName || question.title}
                </h1>
              <DifficultyBadgeLarge difficulty={question.difficulty} />
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
                {question.sourcePlatform && (
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    {question.sourcePlatform}
                    {question.sourceId && ` #${question.sourceId}`}
                  </span>
                )}
                {question.acceptanceRate != null && (
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    Acceptance: <span style={{ color: '#94a3b8' }}>
                      {(question.acceptanceRate * (question.acceptanceRate > 1 ? 1 : 100)).toFixed(1)}%
                    </span>
                  </span>
                )}
                {question.sourceRating && (
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    Rating: <span style={{ color: '#94a3b8' }}>{question.sourceRating}</span>
                  </span>
                )}
                {question.paidOnly && (
                  <span style={{ color: '#eab308', fontSize: '12px', fontWeight: 700 }}>💰 Premium</span>
                )}
                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      color: '#7c3aed', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                      background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                      borderRadius: '8px', padding: '4px 12px', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
                  >
                    Solve Now <ExternalLink size={14} />
                  </a>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '28px' }}>
                  {tags.map(t => (
                    <Link
                      key={t}
                      to={`/questions?tag=${encodeURIComponent(t)}`}
                      style={{
                        background: 'rgba(124,58,237,0.1)', color: '#a78bfa',
                        border: '1px solid rgba(124,58,237,0.2)',
                        borderRadius: '20px', padding: '4px 12px', fontSize: '12px',
                        fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
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
                    style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{ __html: question.statement }}
                  />
                </Section>
              )}

              {/* Examples */}
              {question.examples && (
                <Section title="Examples">
                  {(Array.isArray(question.examples) ? question.examples : [question.examples]).map((ex, i) => (
                    <div key={i} style={{
                      background: '#0a0a14', border: '1px solid #1a1a2e', borderRadius: '10px',
                      padding: '16px 18px', marginBottom: '12px', fontSize: '13px',
                      fontFamily: 'monospace', color: '#94a3b8', whiteSpace: 'pre-wrap',
                    }}>
                      <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
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
                  <div style={{
                    background: '#0a0a14', border: '1px solid #1a1a2e', borderRadius: '10px',
                    padding: '16px 18px', fontSize: '13px', fontFamily: 'monospace',
                    color: '#94a3b8', whiteSpace: 'pre-wrap',
                  }}>
                    {typeof question.constraints === 'string'
                      ? question.constraints
                      : JSON.stringify(question.constraints, null, 2)}
                  </div>
                </Section>
              )}

              {/* Related questions */}
              {related.length > 0 && (
                <Section title="Related Questions">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {related.map(r => (
                      <Link
                        key={r.id}
                        to={`/questions/${r.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          background: '#0a0a14', border: '1px solid #1a1a2e',
                          borderRadius: '10px', padding: '12px 16px', textDecoration: 'none',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a2e'}
                      >
                        <DifficultyBadge difficulty={r.difficulty} />
                        <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 500 }}>{r.title}</span>
                      </Link>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ position: 'sticky', top: '100px' }}>

              {/* Mark status */}
              <div style={{
                background: '#0a0a14', border: '1px solid #1a1a2e',
                borderRadius: '14px', padding: '20px', marginBottom: '20px',
              }}>
                <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                  My Status
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {STATUS_OPTIONS.map(s => {
                    const c = STATUS_COLORS[s];
                    const isActive = currentStatus === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleSetStatus(s)}
                        disabled={statusLoading || !user}
                        style={{
                          padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                          cursor: statusLoading || !user ? 'not-allowed' : 'pointer',
                          border: `1px solid ${isActive ? c.border : '#1e1e3a'}`,
                          background: isActive ? c.bg : 'transparent',
                          color: isActive ? c.text : '#475569',
                          transition: 'all 0.15s', textAlign: 'left', width: '100%',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          opacity: statusLoading ? 0.6 : 1,
                        }}
                      >
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: isActive ? c.text : '#1e293b',
                          flexShrink: 0,
                        }} />
                        {s}
                      </button>
                    );
                  })}
                  {!user && (
                    <p style={{ color: '#334155', fontSize: '12px', margin: '4px 0 0', textAlign: 'center' }}>
                      <Link to="/login" style={{ color: '#7c3aed' }}>Log in</Link> to track your progress
                    </p>
                  )}
                </div>
              </div>

              {/* Companies */}
              {companies.length > 0 && (
                <div style={{
                  background: '#0a0a14', border: '1px solid #1a1a2e',
                  borderRadius: '14px', padding: '20px',
                }}>
                  <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                    Asked By
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {companies.map(({ company, frequency }) => (
                      <Link
                        key={company.id}
                        to={`/dashboard/pyqs/${company.slug}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: '#0d0d1f', border: '1px solid #1a1a2e',
                          borderRadius: '8px', padding: '9px 12px', textDecoration: 'none',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a2e'}
                      >
                        <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600 }}>
                          {company.name}
                        </span>
                        {frequency && (
                          <span style={{
                            fontSize: '11px', color: '#7c3aed', fontWeight: 600,
                            background: 'rgba(124,58,237,0.1)', borderRadius: '4px', padding: '2px 7px',
                          }}>
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

