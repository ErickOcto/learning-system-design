import { Link } from 'react-router-dom';
import { Menu, X, Cpu, Layers, Sparkles } from 'lucide-react';
import Breadcrumb from './Breadcrumb';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header
      style={{
        height: '60px',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-lg)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left section: Mobile toggle + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-glow)',
              border: '1px solid var(--color-accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent-primary)',
            }}
          >
            <Cpu size={16} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'var(--font-size-md)',
              letterSpacing: '-0.01em',
            }}
          >
            System Design <span style={{ color: 'var(--color-accent-primary)' }}>Lab</span>
          </span>
        </Link>

        {/* Desktop Breadcrumb */}
        <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--color-border-subtle)', paddingLeft: '1.5rem' }}>
          <Breadcrumb />
        </div>
      </div>

      {/* Right section: System Status & Playground Link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link
          to="/playground"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-accent-glow)',
            border: '1px solid var(--color-accent-primary)',
            color: 'var(--color-accent-primary)',
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Sparkles size={13} />
          Playground
        </Link>

        <span className="status-badge status-badge--healthy" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span className="status-dot"></span>
          <Layers size={11} style={{ marginRight: '2px' }} />
          28 Topics
        </span>
      </div>
    </header>
  );
}
