import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { CURRICULUM_GROUPS, findRouteByPath } from '../../data/curriculum';

export default function Breadcrumb() {
  const location = useLocation();
  const currentPath = location.pathname;

  if (currentPath === '/') {
    return (
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
        <Home size={14} />
        <span>Curriculum Overview</span>
      </nav>
    );
  }

  const currentRoute = findRouteByPath(currentPath);
  const matchingGroup = CURRICULUM_GROUPS.find((group) =>
    group.routes.some((r) => r.path === currentPath)
  );

  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'var(--color-text-secondary)',
          textDecoration: 'none',
          transition: 'color var(--transition-fast)',
        }}
      >
        <Home size={13} />
        <span>Home</span>
      </Link>

      <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />

      {matchingGroup && (
        <>
          <span style={{ color: 'var(--color-text-secondary)' }}>{matchingGroup.title}</span>
          <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        </>
      )}

      <span style={{ color: 'var(--color-accent-primary)', fontWeight: 500 }}>
        {currentRoute ? currentRoute.title : 'Topic'}
      </span>
    </nav>
  );
}
