// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import ResourceLibrary from '../components/resources/ResourceLibrary';
import { useTopicStore } from '../store/useTopicStore';

describe('Topic Resource Library Feature', () => {
  beforeEach(async () => {
    cleanup();
    await useTopicStore.getState().clearData();
  });

  it('updates status and auto-saves to IndexedDB', async () => {
    render(<ResourceLibrary topicId="foundations/scaling" />);

    const select = screen.getByRole('combobox');
    await act(async () => {
      fireEvent.change(select, { target: { value: 'mastered' } });
    });

    const record = useTopicStore.getState().getTopicRecord('foundations/scaling');
    expect(record.status).toBe('mastered');
  });

  it('allows typing notes and toggling markdown preview mode', async () => {
    render(<ResourceLibrary topicId="foundations/scaling" />);

    const textarea = screen.getByPlaceholderText(/Type your notes here/i);
    fireEvent.change(textarea, { target: { value: '# Scaling Notes\n- Point 1' } });

    // Toggle Preview
    const previewBtn = screen.getByText(/Preview Mode/i);
    fireEvent.click(previewBtn);

    expect(screen.getByText('Scaling Notes')).toBeDefined();
    expect(screen.getByText('Point 1')).toBeDefined();
  });

  it('adds and removes bookmarked links', async () => {
    render(<ResourceLibrary topicId="foundations/scaling" />);

    // Click Add Link
    const addBtn = screen.getByText('Add Link');
    fireEvent.click(addBtn);

    const titleInput = screen.getByPlaceholderText(/Link Title/i);
    const urlInput = screen.getByPlaceholderText(/URL/i);

    fireEvent.change(titleInput, { target: { value: 'NGINX Docs' } });
    fireEvent.change(urlInput, { target: { value: 'https://nginx.org' } });

    const saveBtn = screen.getByText('Save Link');
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    const record = useTopicStore.getState().getTopicRecord('foundations/scaling');
    expect(record.links.length).toBe(1);
    expect(record.links[0].title).toBe('NGINX Docs');
  });
});
