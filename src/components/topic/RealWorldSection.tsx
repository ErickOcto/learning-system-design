import { Building2 } from 'lucide-react';
import { RealWorldExample } from '../../types/topic';

interface RealWorldSectionProps {
  examples: RealWorldExample[];
}

export default function RealWorldSection({ examples }: RealWorldSectionProps) {
  return (
    <section className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Building2 size={18} />
        § 3 — Real-World Context
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {examples.map((example, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.75rem',
            }}
          >
            <strong style={{ color: 'var(--color-accent-primary)', fontFamily: 'var(--font-heading)', minWidth: '120px' }}>
              {example.name}
            </strong>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {example.description}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
