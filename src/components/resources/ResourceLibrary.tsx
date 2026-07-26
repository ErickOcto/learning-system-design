import React, { useState, useEffect } from 'react';
import { useTopicStore } from '../../store/useTopicStore';
import { TopicStatus } from '../../types/storage';
import { Bookmark, Plus, Trash2, Download, Upload, Tag, ExternalLink, Eye, Edit3 } from 'lucide-react';

interface ResourceLibraryProps {
  topicId: string;
}

export default function ResourceLibrary({ topicId }: ResourceLibraryProps) {
  const store = useTopicStore();
  const record = store.getTopicRecord(topicId);

  // Notes state & preview toggle
  const [notes, setNotes] = useState(record.notes || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Tag input state
  const [tagInput, setTagInput] = useState('');

  // Link input state
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');

  // Sync local notes state if topicId changes
  useEffect(() => {
    setNotes(record.notes || '');
  }, [topicId, record.notes]);

  // Debounced auto-save notes to IndexedDB
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== record.notes) {
        store.setTopicNotes(topicId, notes);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [notes, topicId, record.notes, store]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.setTopicStatus(topicId, e.target.value as TopicStatus);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !record.tags.includes(trimmed)) {
      store.setTopicTags(topicId, [...record.tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    store.setTopicTags(
      topicId,
      record.tags.filter((t) => t !== tagToRemove)
    );
  };

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) {
      setLinkError('Title and URL are required.');
      return;
    }
    store.addTopicLink(topicId, { title: linkTitle.trim(), url: linkUrl.trim() });
    setLinkTitle('');
    setLinkUrl('');
    setShowAddLink(false);
    setLinkError('');
  };

  const handleExportJSON = async () => {
    const json = await store.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-design-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        await store.importData(text);
        alert('Data imported successfully!');
      } catch (err) {
        alert(`Import failed: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  // Simple Markdown text preview formatter
  const renderMarkdownPreview = (text: string) => {
    if (!text.trim()) {
      return <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No notes added yet.</span>;
    }
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) {
        return <h3 key={i} style={{ fontSize: 'var(--font-size-lg)', marginTop: '0.5rem', color: 'var(--color-accent-primary)' }}>{line.slice(2)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h4 key={i} style={{ fontSize: 'var(--font-size-md)', marginTop: '0.5rem', color: 'var(--color-text-primary)' }}>{line.slice(3)}</h4>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem' }}>{line.slice(2)}</li>;
      }
      return <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>;
    });
  };

  return (
    <section className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bookmark size={18} />
          § 6 — My Resources
        </h2>

        {/* Data Portability Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleExportJSON}
            className="status-badge status-badge--info"
            style={{ cursor: 'pointer', border: '1px solid var(--color-border-subtle)' }}
            title="Export data as JSON file"
          >
            <Download size={12} />
            Export JSON
          </button>

          <label
            className="status-badge status-badge--info"
            style={{ cursor: 'pointer', border: '1px solid var(--color-border-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            title="Import data from JSON file"
          >
            <Upload size={12} />
            Import JSON
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Row 1: Status Dropdown & Tag Manager */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {/* Status Selector */}
        <div style={{ backgroundColor: 'var(--color-bg-base)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
            LEARNING STATUS
          </label>
          <select
            value={record.status}
            onChange={handleStatusChange}
            style={{
              width: '100%',
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.6rem',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
            }}
          >
            <option value="not_started">⚪ Not Started</option>
            <option value="learning">🔵 Learning</option>
            <option value="comfortable">🟡 Comfortable</option>
            <option value="mastered">🟢 Mastered</option>
          </select>
        </div>

        {/* Tag Editor */}
        <div style={{ backgroundColor: 'var(--color-bg-base)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
            TAGS
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
            {record.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: 'var(--color-accent-glow)',
                  color: 'var(--color-accent-primary)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <Tag size={10} />
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '0.35rem' }}>
            <input
              type="text"
              placeholder="Add tag (e.g. interview-core)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.3rem 0.5rem',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-xs)',
              }}
            />
            <button
              type="submit"
              className="status-badge status-badge--info"
              style={{ cursor: 'pointer', padding: '0.3rem 0.6rem' }}
            >
              + Tag
            </button>
          </form>
        </div>
      </div>

      {/* Row 2: Markdown Notes Editor */}
      <div style={{ backgroundColor: 'var(--color-bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            PERSONAL NOTES (MARKDOWN)
          </label>
          <button
            onClick={() => setIsPreviewMode((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent-primary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {isPreviewMode ? <Edit3 size={13} /> : <Eye size={13} />}
            {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
        </div>

        {isPreviewMode ? (
          <div
            style={{
              minHeight: '120px',
              padding: '0.75rem',
              backgroundColor: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
            }}
          >
            {renderMarkdownPreview(notes)}
          </div>
        ) : (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type your notes here in Markdown syntax..."
            rows={5}
            style={{
              width: '100%',
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-sm)',
              resize: 'vertical',
            }}
          />
        )}
      </div>

      {/* Row 3: Saved Links Manager */}
      <div style={{ backgroundColor: 'var(--color-bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <label style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            BOOKMARKED LINKS ({record.links.length})
          </label>
          <button
            onClick={() => setShowAddLink((prev) => !prev)}
            className="status-badge status-badge--info"
            style={{ cursor: 'pointer' }}
          >
            <Plus size={12} />
            Add Link
          </button>
        </div>

        {showAddLink && (
          <form
            onSubmit={handleAddLinkSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '1rem',
              backgroundColor: 'var(--color-bg-surface)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            {linkError && <span style={{ color: 'var(--color-status-error)', fontSize: 'var(--font-size-xs)' }}>{linkError}</span>}
            <input
              type="text"
              placeholder="Link Title (e.g. NGINX Load Balancing Docs)"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              style={{
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.6rem',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-xs)',
              }}
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              style={{
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.6rem',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-xs)',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAddLink(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 'var(--font-size-xs)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="status-badge status-badge--healthy"
                style={{ cursor: 'pointer' }}
              >
                Save Link
              </button>
            </div>
          </form>
        )}

        {record.links.length === 0 ? (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            No links saved for this topic yet.
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {record.links.map((link) => (
              <div
                key={link.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.6rem',
                  backgroundColor: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: 'var(--color-accent-primary)',
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-body)',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} />
                  {link.title}
                </a>

                <button
                  onClick={() => store.removeTopicLink(topicId, link.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-status-error)', cursor: 'pointer', padding: '2px' }}
                  title="Delete link"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
