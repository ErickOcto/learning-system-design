import { useState } from 'react';
import { ReactFlowProvider, Node } from '@xyflow/react';
import PlaygroundPalette from '../components/playground/PlaygroundPalette';
import PlaygroundCanvas from '../components/playground/PlaygroundCanvas';
import PlaygroundControlsBar from '../components/playground/PlaygroundControlsBar';
import PlaygroundConfigDrawer from '../components/playground/PlaygroundConfigDrawer';
import { PlaygroundNodeData } from '../components/playground/types';
import { Cpu } from 'lucide-react';

function PlaygroundPageContent() {
  const [selectedNode, setSelectedNode] = useState<Node<PlaygroundNodeData> | null>(null);

  const handleUpdateNodeData = (nodeId: string, newData: Partial<PlaygroundNodeData>) => {
    setSelectedNode((prev) => {
      if (!prev || prev.id !== nodeId) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          ...newData,
        },
      };
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
        width: '100%',
        backgroundColor: 'var(--color-bg-base)',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          height: '44px',
          backgroundColor: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-md)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Cpu size={18} style={{ color: 'var(--color-accent-primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            Architecture Playground
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-glow)',
              color: 'var(--color-accent-primary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            Core Nodes v1
          </span>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <PlaygroundControlsBar />

      {/* Main Canvas Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        <PlaygroundPalette />

        <div style={{ flex: 1, position: 'relative' }}>
          <PlaygroundCanvas onSelectNode={setSelectedNode} />
        </div>

        {selectedNode && (
          <PlaygroundConfigDrawer
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdateNodeData={handleUpdateNodeData}
          />
        )}
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <ReactFlowProvider>
      <PlaygroundPageContent />
    </ReactFlowProvider>
  );
}
