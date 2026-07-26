import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, PlayCircle, BarChart2, FileText, CheckCircle2, Circle } from 'lucide-react';
import { CURRICULUM_GROUPS, VizType } from '../../data/curriculum';
import { useTopicStore } from '../../store/useTopicStore';
import { TopicStatus } from '../../types/storage';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ isOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const topicsStore = useTopicStore((state) => state.topics);

  // Initialize expanded groups state (all expanded by default)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CURRICULUM_GROUPS.forEach((g) => {
      initial[g.id] = true;
    });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const getVizIcon = (type: VizType) => {
    switch (type) {
      case 'simulation':
        return <PlayCircle size={13} style={{ color: 'var(--color-status-healthy)', flexShrink: 0 }} />;
      case 'interactive':
        return <BarChart2 size={13} style={{ color: 'var(--color-status-warning)', flexShrink: 0 }} />;
      case 'prose':
        return <FileText size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />;
    }
  };

  const getStatusDot = (status?: TopicStatus) => {
    switch (status) {
      case 'mastered':
        return <CheckCircle2 size={12} style={{ color: 'var(--color-status-healthy)' }} />;
      case 'comfortable':
        return <CheckCircle2 size={12} style={{ color: 'var(--color-status-warning)' }} />;
      case 'learning':
        return <Circle size={12} style={{ color: 'var(--color-accent-primary)' }} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 45,
          }}
        />
      )}

      <aside
        style={{
          width: '280px',
          backgroundColor: 'var(--color-bg-surface)',
          borderRight: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 60px)',
          position: 'sticky',
          top: '60px',
          overflowY: 'auto',
          zIndex: 50,
          transition: 'transform var(--transition-fast)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Curriculum Map (~28 Routes)
          </div>
        </div>

        <nav style={{ padding: 'var(--space-sm) 0', flex: 1 }}>
          {CURRICULUM_GROUPS.map((group) => {
            const isExpanded = expandedGroups[group.id];
            const hasActiveRoute = group.routes.some((r) => r.path === location.pathname);

            return (
              <div key={group.id} style={{ marginBottom: '0.25rem' }}>
                {/* Group Header Toggle */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 1rem',
                    backgroundColor: hasActiveRoute ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                    border: 'none',
                    color: hasActiveRoute ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {group.title}
                  </span>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Group Routes List */}
                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingLeft: '0.5rem' }}>
                    {group.routes.map((route) => {
                      const topicRecord = topicsStore[route.id];
                      const isSelected = location.pathname === route.path;

                      return (
                        <NavLink
                          key={route.id}
                          to={route.path}
                          onClick={onCloseMobile}
                          style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.4rem 0.75rem 0.4rem 1rem',
                            textDecoration: 'none',
                            fontSize: 'var(--font-size-xs)',
                            fontFamily: 'var(--font-body)',
                            color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                            backgroundColor: isActive ? 'var(--color-accent-glow)' : 'transparent',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: isActive ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                            transition: 'all var(--transition-fast)',
                          })}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                            {getVizIcon(route.vizType)}
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontWeight: isSelected ? 600 : 400,
                              }}
                            >
                              {route.title}
                            </span>
                          </div>
                          {getStatusDot(topicRecord?.status)}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
