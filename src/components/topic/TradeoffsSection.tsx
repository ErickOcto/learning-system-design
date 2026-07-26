import { Scale, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { TopicTradeoffs } from '../../types/topic';

interface TradeoffsSectionProps {
  tradeoffs: TopicTradeoffs;
}

export default function TradeoffsSection({ tradeoffs }: TradeoffsSectionProps) {
  return (
    <section className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Scale size={18} />
        § 4 — Trade-offs &amp; Constraints
      </h2>

      {/* Two Column Pros vs Cons Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Pros Column */}
        <div style={{ backgroundColor: 'var(--color-bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-status-healthy-border)' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-status-healthy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={16} />
            Advantages (Pros)
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tradeoffs.pros.map((pro, i) => (
              <li key={i} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-status-healthy)' }}>•</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>

        {/* Cons Column */}
        <div style={{ backgroundColor: 'var(--color-bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-status-error-border)' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-status-error)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <XCircle size={16} />
            Disadvantages (Cons)
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tradeoffs.cons.map((con, i) => (
              <li key={i} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-status-error)' }}>•</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* When NOT to Use Callout */}
      <div
        style={{
          backgroundColor: 'var(--color-status-warning-bg)',
          border: '1px solid var(--color-status-warning-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          display: 'flex',
          gap: '0.75rem',
        }}
      >
        <AlertTriangle size={18} style={{ color: 'var(--color-status-warning)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-status-warning)', fontFamily: 'var(--font-heading)', display: 'block', marginBottom: '0.25rem' }}>
            When NOT to use this pattern:
          </strong>
          <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
            {tradeoffs.whenNotToUse}
          </span>
        </div>
      </div>
    </section>
  );
}
