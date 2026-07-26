import ExplanationSection from './ExplanationSection';
import RealWorldSection from './RealWorldSection';
import TradeoffsSection from './TradeoffsSection';
import RelatedTopicsSection from './RelatedTopicsSection';
import { TopicPageProps } from '../../types/topic';
import { PlayCircle, Bookmark } from 'lucide-react';

export default function TopicPageLayout({
  topicId,
  title,
  group,
  explanation,
  realWorldExamples,
  tradeoffs,
  relatedTopicIds,
  Visualizer,
}: TopicPageProps) {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Metadata */}
      <header className="blueprint-card" style={{ borderLeft: '4px solid var(--color-accent-primary)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          {group}
        </span>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
          {title}
        </h1>
      </header>

      {/* § 1 — Explanation */}
      <ExplanationSection explanation={explanation} />

      {/* § 2 — See It In Action (Visualization Slot) */}
      <section className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlayCircle size={18} />
          § 2 — See It In Action
        </h2>

        {Visualizer ? (
          <Visualizer />
        ) : (
          <div
            style={{
              padding: '2.5rem',
              backgroundColor: 'var(--color-bg-base)',
              border: '2px dashed var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-sm)' }}>
              [VISUALIZER_SLOT: {topicId}]
            </p>
          </div>
        )}
      </section>

      {/* § 3 — Real-World Context */}
      <RealWorldSection examples={realWorldExamples} />

      {/* § 4 — Trade-offs */}
      <TradeoffsSection tradeoffs={tradeoffs} />

      {/* § 5 — Related Topics */}
      <RelatedTopicsSection relatedTopicIds={relatedTopicIds} />

      {/* § 6 — My Resources Placeholder Slot */}
      <section className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bookmark size={18} />
          § 6 — My Resources
        </h2>
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--color-bg-base)',
            border: '1px dashed var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          [RESOURCE_LIBRARY_SLOT: Notes, Bookmarks, and Status Manager for {topicId}]
        </div>
      </section>
    </article>
  );
}
