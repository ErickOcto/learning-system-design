import { Link } from 'react-router-dom';
import { GitFork } from 'lucide-react';
import { findRouteByPath } from '../../data/curriculum';

interface RelatedTopicsSectionProps {
  relatedTopicIds: string[];
}

export default function RelatedTopicsSection({ relatedTopicIds }: RelatedTopicsSectionProps) {
  return (
    <section className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <GitFork size={18} />
        § 5 — Related Topics
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {relatedTopicIds.map((topicPath) => {
          const route = findRouteByPath(topicPath);
          const title = route ? route.title : topicPath;

          return (
            <Link
              key={topicPath}
              to={topicPath}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.35rem 0.75rem',
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-accent-primary)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-mono)',
                transition: 'all var(--transition-fast)',
              }}
            >
              #{title}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
