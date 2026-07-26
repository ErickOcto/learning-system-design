import { Info } from 'lucide-react';

interface ExplanationSectionProps {
  explanation: string;
}

export default function ExplanationSection({ explanation }: ExplanationSectionProps) {
  return (
    <section className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Info size={18} />
        § 1 — What is This?
      </h2>
      <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
        {explanation}
      </p>
    </section>
  );
}
