import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Cpu, Layers, Sparkles, Search } from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import { ALL_CURRICULUM_ROUTES } from '../../data/curriculum';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const filteredRoutes = ALL_CURRICULUM_ROUTES.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.topicsCovered.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Center Search Input */}
      <div style={{ position: 'relative', width: '220px' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', padding: '3px 8px' }}>
          <Search size={13} style={{ color: 'var(--color-text-muted)', marginRight: '6px' }} />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>

        {/* Dropdown Results */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '36px',
              left: 0,
              right: 0,
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '260px',
              overflowY: 'auto',
              zIndex: 50,
            }}
          >
            {filteredRoutes.length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-text-muted)' }}>No topics match query.</div>
            ) : (
              filteredRoutes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    navigate(r.path);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>{r.topicsCovered}</div>
                </div>
              ))
            )}
          </div>
        )}
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
