import { DIFFICULTY_COLORS, STATUS_COLORS } from '@/config/constants';

export function DifficultyBadge({ difficulty }) {
  const c = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.MEDIUM;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: '6px', padding: '2px 10px', fontSize: '12px', fontWeight: 600,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {difficulty}
    </span>
  );
}

export function DifficultyBadgeLarge({ difficulty }) {
  const c = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.MEDIUM;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: '8px', padding: '4px 14px', fontSize: '13px', fontWeight: 700,
    }}>
      {difficulty}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (!status) return null;
  const c = STATUS_COLORS[status] || STATUS_COLORS.SKIPPED;
  return (
    <span style={{
      background: c.bg, color: c.text,
      borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600,
    }}>
      {status}
    </span>
  );
}

export function TagPill({ name }) {
  return (
    <span style={{
      background: 'rgba(124,58,237,0.12)', color: '#a78bfa',
      border: '1px solid rgba(124,58,237,0.2)',
      borderRadius: '20px', padding: '2px 9px', fontSize: '11px', fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      {name}
    </span>
  );
}

// ── Layout helpers ────────────────────────────────────────────────────────────

/** Section heading + content wrapper used in the detail page. */
export function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontSize: '16px', fontWeight: 700, color: '#94a3b8',
        margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Animated skeleton pulse block. */
export function SkeletonBlock({ width = '100%', height = '16px', radius = '4px' }) {
  return (
    <div style={{
      width, height, background: '#1a1a2e', borderRadius: radius,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}
