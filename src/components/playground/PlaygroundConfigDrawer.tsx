import React from 'react';
import { Node } from '@xyflow/react';
import { X, Settings } from 'lucide-react';
import {
  PlaygroundNodeData,
  LoadBalancerAlgorithm,
  ClientPattern,
  DatabaseType,
  EvictionPolicy,
} from './types';

interface PlaygroundConfigDrawerProps {
  selectedNode: Node<PlaygroundNodeData> | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, newData: Partial<PlaygroundNodeData>) => void;
}

export default function PlaygroundConfigDrawer({
  selectedNode,
  onClose,
  onUpdateNodeData,
}: PlaygroundConfigDrawerProps) {
  if (!selectedNode) return null;

  const data = selectedNode.data;
  const config = (data.config || {}) as Record<string, any>;
  const status = data.status || 'healthy';

  const handleStatusChange = (newStatus: 'healthy' | 'degraded' | 'down') => {
    onUpdateNodeData(selectedNode.id, { status: newStatus });
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNodeData(selectedNode.id, { label: e.target.value });
  };

  const updateConfig = (newConfigProps: Record<string, any>) => {
    onUpdateNodeData(selectedNode.id, {
      config: { ...config, ...newConfigProps },
    });
  };

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: 'var(--color-bg-surface)',
        borderLeft: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 20,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={16} style={{ color: 'var(--color-accent-primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Node Configuration
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Drawer Body */}
      <div style={{ padding: 'var(--space-md)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Label input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Node Label
          </label>
          <input
            type="text"
            value={data.label}
            onChange={handleLabelChange}
            style={{
              backgroundColor: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.6rem',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
          />
        </div>

        {/* Health status control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Health Status
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['healthy', 'degraded', 'down'] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                style={{
                  flex: 1,
                  padding: '0.35rem 0',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${
                    status === st
                      ? st === 'healthy'
                        ? 'var(--color-status-healthy-border)'
                        : st === 'degraded'
                        ? 'var(--color-status-warning-border)'
                        : 'var(--color-status-error-border)'
                      : 'var(--color-border-subtle)'
                  }`,
                  backgroundColor:
                    status === st
                      ? st === 'healthy'
                        ? 'var(--color-status-healthy-bg)'
                        : st === 'degraded'
                        ? 'var(--color-status-warning-bg)'
                        : 'var(--color-status-error-bg)'
                      : 'var(--color-bg-base)',
                  color:
                    status === st
                      ? st === 'healthy'
                        ? 'var(--color-status-healthy)'
                        : st === 'degraded'
                        ? 'var(--color-status-warning)'
                        : 'var(--color-status-error)'
                      : 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Client-specific settings */}
        {data.componentType === 'client' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Request Rate (RPS)
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-accent-primary)' }}>
                  {config.requestRate || 5} req/s
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={config.requestRate || 5}
                onChange={(e) => updateConfig({ requestRate: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Traffic Pattern
              </label>
              <select
                value={config.pattern || 'steady'}
                onChange={(e) => updateConfig({ pattern: e.target.value as ClientPattern })}
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.6rem',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-xs)',
                  outline: 'none',
                }}
              >
                <option value="steady">Steady Flow</option>
                <option value="bursty">Bursty Traffic</option>
              </select>
            </div>
          </div>
        )}

        {/* Load Balancer-specific settings */}
        {data.componentType === 'load_balancer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Routing Algorithm
              </label>
              <select
                value={config.algorithm || 'round_robin'}
                onChange={(e) => updateConfig({ algorithm: e.target.value as LoadBalancerAlgorithm })}
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.6rem',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-xs)',
                  outline: 'none',
                }}
              >
                <option value="round_robin">Round Robin</option>
                <option value="least_connections">Least Connections</option>
                <option value="weighted">Weighted</option>
                <option value="ip_hash">IP Hash</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Health Checks Enabled
              </label>
              <input
                type="checkbox"
                checked={config.healthChecks !== false}
                onChange={(e) => updateConfig({ healthChecks: e.target.checked })}
                style={{ accentColor: 'var(--color-accent-primary)' }}
              />
            </div>
          </div>
        )}

        {/* Server-specific settings */}
        {data.componentType === 'server' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Max Concurrency Capacity
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-accent-primary)' }}>
                  {config.maxCapacity || 10}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={config.maxCapacity || 10}
                onChange={(e) => updateConfig({ maxCapacity: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Processing Time (ms)
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-accent-primary)' }}>
                  {config.processingTimeMs || 200} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={config.processingTimeMs || 200}
                onChange={(e) => updateConfig({ processingTimeMs: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent-primary)' }}
              />
            </div>
          </div>
        )}

        {/* Database-specific settings */}
        {data.componentType === 'database' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Database Type
              </label>
              <select
                value={config.dbType || 'primary'}
                onChange={(e) => updateConfig({ dbType: e.target.value as DatabaseType })}
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.6rem',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-xs)',
                  outline: 'none',
                }}
              >
                <option value="primary">Primary (Read/Write)</option>
                <option value="replica">Replica (Read-Only)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Replication Lag (ms)
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-accent-primary)' }}>
                  {config.replicationLagMs || 300} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={config.replicationLagMs || 300}
                onChange={(e) => updateConfig({ replicationLagMs: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Read / Write Ratio
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-accent-primary)' }}>
                  {config.readWriteSplit || 80}% Reads
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.readWriteSplit || 80}
                onChange={(e) => updateConfig({ readWriteSplit: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent-primary)' }}
              />
            </div>
          </div>
        )}

        {/* Cache-specific settings */}
        {data.componentType === 'cache' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Cache Hit Ratio
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-status-healthy)' }}>
                  {config.hitRatio || 70}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.hitRatio || 70}
                onChange={(e) => updateConfig({ hitRatio: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-status-healthy)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Eviction Policy
              </label>
              <select
                value={config.evictionPolicy || 'LRU'}
                onChange={(e) => updateConfig({ evictionPolicy: e.target.value as EvictionPolicy })}
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.6rem',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-xs)',
                  outline: 'none',
                }}
              >
                <option value="LRU">LRU (Least Recently Used)</option>
                <option value="LFU">LFU (Least Frequently Used)</option>
                <option value="FIFO">FIFO (First In First Out)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Max Capacity
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-accent-primary)' }}>
                  {config.capacity || 10} items
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={config.capacity || 10}
                onChange={(e) => updateConfig({ capacity: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent-primary)' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
