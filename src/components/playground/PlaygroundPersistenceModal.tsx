import { useState, useEffect, useRef } from 'react';
import { X, Save, FolderOpen, Download, Upload, Trash2, Check, FileJson } from 'lucide-react';
import { SavedArchitecture } from '../../types/storage';
import { indexedDbAdapter } from '../../storage/indexedDbAdapter';

interface PlaygroundPersistenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNodes: any[];
  currentEdges: any[];
  onLoadArchitecture: (nodes: any[], edges: any[]) => void;
}

export default function PlaygroundPersistenceModal({
  isOpen,
  onClose,
  currentNodes,
  currentEdges,
  onLoadArchitecture,
}: PlaygroundPersistenceModalProps) {
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'export'>('save');
  const [archName, setArchName] = useState('');
  const [savedList, setSavedList] = useState<SavedArchitecture[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadSavedList();
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const loadSavedList = async () => {
    const list = await indexedDbAdapter.getSavedArchitectures();
    setSavedList(list);
  };

  const handleSave = async () => {
    if (!archName.trim()) {
      setErrorMsg('Please enter a name for the architecture.');
      return;
    }

    const newArch: SavedArchitecture = {
      id: `arch-${Date.now()}`,
      name: archName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      graph: {
        nodes: currentNodes,
        edges: currentEdges,
      },
    };

    await indexedDbAdapter.saveArchitecture(newArch);
    setArchName('');
    setSuccessMsg(`Architecture "${newArch.name}" saved!`);
    await loadSavedList();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleLoad = (arch: SavedArchitecture) => {
    onLoadArchitecture(arch.graph.nodes, arch.graph.edges);
    onClose();
  };

  const handleDelete = async (id: string, name: string) => {
    await indexedDbAdapter.deleteArchitecture(id);
    setSuccessMsg(`Deleted "${name}"`);
    await loadSavedList();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleExportJson = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      graph: {
        nodes: currentNodes,
        edges: currentEdges,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);

        if (parsed.graph && Array.isArray(parsed.graph.nodes) && Array.isArray(parsed.graph.edges)) {
          onLoadArchitecture(parsed.graph.nodes, parsed.graph.edges);
          setSuccessMsg('Architecture imported successfully!');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1500);
        } else {
          setErrorMsg('Invalid file format: missing graph nodes or edges.');
        }
      } catch (err) {
        setErrorMsg('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: '500px',
          maxHeight: '80vh',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
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
            <FolderOpen size={18} style={{ color: 'var(--color-accent-primary)' }} />
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--font-size-md)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              Saved Architectures
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
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-base)',
          }}
        >
          {[
            { id: 'save', label: 'Save Current', icon: <Save size={14} /> },
            { id: 'load', label: `Saved (${savedList.length})`, icon: <FolderOpen size={14} /> },
            { id: 'export', label: 'Export / Import', icon: <FileJson size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '0.6rem 0.5rem',
                border: 'none',
                borderBottom:
                  activeTab === tab.id
                    ? '2px solid var(--color-accent-primary)'
                    : '2px solid transparent',
                backgroundColor: 'transparent',
                color:
                  activeTab === tab.id
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-text-muted)',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        {successMsg && (
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-status-healthy-bg)',
              color: 'var(--color-status-healthy)',
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Check size={14} />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-status-error-bg)',
              color: 'var(--color-status-error)',
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: 'var(--space-md)', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'save' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Architecture Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Microservices Load Balancer & Replica DB"
                  value={archName}
                  onChange={(e) => setArchName(e.target.value)}
                  style={{
                    backgroundColor: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.75rem',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                }}
              >
                Current layout: {currentNodes.length} nodes, {currentEdges.length} edges
              </div>

              <button
                onClick={handleSave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-accent-primary)',
                  color: 'var(--color-text-inverse)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                <Save size={14} />
                Save Architecture
              </button>
            </div>
          )}

          {activeTab === 'load' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {savedList.length === 0 ? (
                <div
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  No saved architectures found. Save your current canvas layout first!
                </div>
              ) : (
                savedList.map((arch) => (
                  <div
                    key={arch.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {arch.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {arch.graph.nodes.length} nodes • {new Date(arch.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleLoad(arch)}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-accent-glow)',
                          border: '1px solid var(--color-accent-primary)',
                          color: 'var(--color-accent-primary)',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Load
                      </button>

                      <button
                        onClick={() => handleDelete(arch.id, arch.name)}
                        style={{
                          padding: '0.25rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--color-status-error)',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Export Current Layout to JSON
                </div>
                <button
                  onClick={handleExportJson}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
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
                  <Download size={14} />
                  Download .json file
                </button>
              </div>

              <div
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Import Architecture from JSON
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
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
                  <Upload size={14} />
                  Upload .json file
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
