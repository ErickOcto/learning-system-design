import React from 'react';
import {
  Users,
  Network,
  Server,
  Database,
  Zap,
  Layers,
  Globe,
  ShieldAlert,
  GripVertical,
} from 'lucide-react';
import { ComponentNodeMeta, ComponentNodeType } from './types';

export const PALETTE_ITEMS: ComponentNodeMeta[] = [
  {
    type: 'client',
    label: 'Client',
    category: 'traffic',
    description: 'Generates traffic load (steady or bursty)',
    iconName: 'users',
  },
  {
    type: 'load_balancer',
    label: 'Load Balancer',
    category: 'compute',
    description: 'Distributes traffic across downstream nodes',
    iconName: 'network',
  },
  {
    type: 'server',
    label: 'App Server',
    category: 'compute',
    description: 'Processes incoming requests',
    iconName: 'server',
  },
  {
    type: 'database',
    label: 'Database',
    category: 'storage',
    description: 'Primary/Replica SQL/NoSQL storage',
    iconName: 'database',
  },
  {
    type: 'cache',
    label: 'Cache',
    category: 'storage',
    description: 'In-memory key-value cache (LRU/LFU)',
    iconName: 'zap',
  },
  {
    type: 'message_queue',
    label: 'Message Queue',
    category: 'buffer',
    description: 'Buffers bursts & decouples consumers',
    iconName: 'layers',
  },
  {
    type: 'cdn',
    label: 'CDN / Edge',
    category: 'traffic',
    description: 'Serves content geographically close to clients',
    iconName: 'globe',
  },
  {
    type: 'rate_limiter',
    label: 'Rate Limiter',
    category: 'traffic',
    description: 'Throttles traffic using Token Bucket',
    iconName: 'shield_alert',
  },
];

function getPaletteIcon(type: ComponentNodeType) {
  switch (type) {
    case 'client':
      return <Users size={16} style={{ color: 'var(--color-accent-primary)' }} />;
    case 'load_balancer':
      return <Network size={16} style={{ color: 'var(--color-status-healthy)' }} />;
    case 'server':
      return <Server size={16} style={{ color: 'var(--color-accent-primary)' }} />;
    case 'database':
      return <Database size={16} style={{ color: 'var(--color-status-warning)' }} />;
    case 'cache':
      return <Zap size={16} style={{ color: 'var(--color-status-healthy)' }} />;
    case 'message_queue':
      return <Layers size={16} style={{ color: 'var(--color-status-info)' }} />;
    case 'cdn':
      return <Globe size={16} style={{ color: 'var(--color-accent-primary)' }} />;
    case 'rate_limiter':
      return <ShieldAlert size={16} style={{ color: 'var(--color-status-error)' }} />;
  }
}

export default function PlaygroundPalette() {
  const onDragStart = (event: React.DragEvent, nodeType: ComponentNodeType, label: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      style={{
        width: '240px',
        backgroundColor: 'var(--color-bg-surface)',
        borderRight: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 'var(--space-md)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 'var(--space-md)',
        }}
      >
        Component Palette
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {PALETTE_ITEMS.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type, item.label)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.5rem 0.6rem',
              backgroundColor: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'grab',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <GripVertical size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getPaletteIcon(item.type)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
