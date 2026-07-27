import { useState } from 'react';
import { ReactFlowProvider, Node } from '@xyflow/react';
import PlaygroundPalette from '../components/playground/PlaygroundPalette';
import PlaygroundCanvas from '../components/playground/PlaygroundCanvas';
import PlaygroundControlsBar from '../components/playground/PlaygroundControlsBar';
import PlaygroundConfigDrawer from '../components/playground/PlaygroundConfigDrawer';
import PlaygroundPersistenceModal from '../components/playground/PlaygroundPersistenceModal';
import { PlaygroundNodeData } from '../components/playground/types';
import { Cpu, FolderOpen } from 'lucide-react';

function PlaygroundPageContent() {
  const [selectedNode, setSelectedNode] = useState<Node<PlaygroundNodeData> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNodes, setCurrentNodes] = useState<any[]>([]);
  const [currentEdges, setCurrentEdges] = useState<any[]>([]);
  const [loadedGraph, setLoadedGraph] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [updatedNodeData, setUpdatedNodeData] = useState<{ id: string; data: Partial<PlaygroundNodeData>; timestamp: number } | null>(null);

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
    setUpdatedNodeData({ id: nodeId, data: newData, timestamp: Date.now() });
  };

  const handleNodesEdgesChange = (nodes: any[], edges: any[]) => {
    setCurrentNodes(nodes);
    setCurrentEdges(edges);
  };

  const handleLoadArchitecture = (nodes: any[], edges: any[]) => {
    setLoadedGraph({ nodes, edges });
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
            Persistence v1
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FolderOpen size={14} style={{ color: 'var(--color-accent-primary)' }} />
            Saved Architectures
          </button>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <PlaygroundControlsBar />

      {/* Main Canvas Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden', height: '100%', minHeight: '450px' }}>
        <PlaygroundPalette />

        <div style={{ flex: 1, position: 'relative', height: '100%', minHeight: '450px' }}>
          <PlaygroundCanvas
            onSelectNode={setSelectedNode}
            onNodesEdgesChange={handleNodesEdgesChange}
            loadedGraph={loadedGraph}
            updatedNodeData={updatedNodeData}
          />
        </div>

        {selectedNode && (
          <PlaygroundConfigDrawer
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdateNodeData={handleUpdateNodeData}
          />
        )}
      </div>

      {/* Persistence Modal */}
      <PlaygroundPersistenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentNodes={currentNodes}
        currentEdges={currentEdges}
        onLoadArchitecture={handleLoadArchitecture}
      />
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
