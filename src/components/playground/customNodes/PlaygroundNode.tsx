import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import {
  Users,
  Network,
  Server,
  Database,
  Zap,
  Layers,
  Globe,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { PlaygroundNodeData, ComponentNodeType } from '../types';

function getNodeIcon(type: ComponentNodeType) {
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
    default:
      return <HelpCircle size={16} />;
  }
}

type PlaygroundNodeProps = NodeProps<Node<PlaygroundNodeData>>;

export default function PlaygroundNode({ data, selected }: PlaygroundNodeProps) {
  const status = data.status || 'healthy';

  const statusColor =
    status === 'healthy'
      ? 'var(--color-status-healthy)'
      : status === 'degraded'
      ? 'var(--color-status-warning)'
      : 'var(--color-status-error)';

  return (
    <div
      style={{
        padding: '0.6rem 0.85rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-bg-surface)',
        border: selected
          ? '2px solid var(--color-accent-primary)'
          : '1px solid var(--color-border-subtle)',
        boxShadow: selected
          ? '0 0 12px var(--color-accent-glow)'
          : 'var(--shadow-sm)',
        minWidth: '150px',
        transition: 'all var(--transition-fast)',
        userSelect: 'none',
      }}
    >
      {/* Target handle (left & top) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'var(--color-accent-primary)',
          width: '8px',
          height: '8px',
          border: 'none',
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: 'var(--color-accent-primary)',
          width: '8px',
          height: '8px',
          border: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div
          style={{
            padding: '0.35rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {getNodeIcon(data.componentType)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {data.componentType.replace('_', ' ')}
          </div>
        </div>

        {/* Status indicator dot */}
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
          }}
        />
      </div>

      {/* Source handle (right & bottom) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'var(--color-accent-primary)',
          width: '8px',
          height: '8px',
          border: 'none',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: 'var(--color-accent-primary)',
          width: '8px',
          height: '8px',
          border: 'none',
        }}
      />
    </div>
  );
}
