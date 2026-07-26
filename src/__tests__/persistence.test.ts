import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IndexedDbStorageAdapter } from '../storage/indexedDbAdapter';
import { createTopicStore } from '../store/useTopicStore';
import { UserTopicRecord } from '../types/storage';

describe('Local Persistence Layer & Zustand Store', () => {
  let adapter: IndexedDbStorageAdapter;

  beforeEach(async () => {
    // Unique key per test to avoid test contamination
    adapter = new IndexedDbStorageAdapter(`test_store_${Math.random()}`);
    await adapter.clear();
  });

  describe('StorageAdapter (IndexedDB)', () => {
    it('saves and retrieves a topic record', async () => {
      const topicRecord: UserTopicRecord = {
        topicId: 'foundations/scaling',
        status: 'comfortable',
        notes: '# Horizontal Scaling Notes\n\nScales out cleanly.',
        links: [
          {
            id: 'link-1',
            title: 'Vite Docs',
            url: 'https://vitejs.dev',
            createdAt: new Date().toISOString(),
          },
        ],
        tags: ['scaling', 'architecture'],
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveTopic('foundations/scaling', topicRecord);

      const retrieved = await adapter.getTopic('foundations/scaling');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.status).toBe('comfortable');
      expect(retrieved?.notes).toContain('Horizontal Scaling Notes');
      expect(retrieved?.links.length).toBe(1);
      expect(retrieved?.tags).toEqual(['scaling', 'architecture']);
    });

    it('exports data as JSON string and imports it back', async () => {
      const sampleRecord: UserTopicRecord = {
        topicId: 'caching/eviction',
        status: 'mastered',
        notes: 'LRU vs LFU notes',
        links: [],
        tags: ['caching'],
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveTopic('caching/eviction', sampleRecord);

      const exportedJson = await adapter.exportAll();
      expect(typeof exportedJson).toBe('string');

      const parsedExport = JSON.parse(exportedJson);
      expect(parsedExport.version).toBe('1.0');
      expect(parsedExport.topics['caching/eviction']).toBeDefined();
      expect(parsedExport.topics['caching/eviction'].status).toBe('mastered');

      // Create a fresh adapter and import exported JSON
      const newAdapter = new IndexedDbStorageAdapter(`test_import_${Math.random()}`);
      await newAdapter.importAll(exportedJson);

      const importedRecord = await newAdapter.getTopic('caching/eviction');
      expect(importedRecord?.status).toBe('mastered');
      expect(importedRecord?.notes).toBe('LRU vs LFU notes');
    });

    it('rejects invalid JSON on importAll', async () => {
      await expect(adapter.importAll('invalid json')).rejects.toThrow('Invalid JSON format');
      await expect(adapter.importAll('{"foo": "bar"}')).rejects.toThrow('Invalid export format');
    });
  });

  describe('Zustand topicStore Integration', () => {
    it('manages topic status, notes, links, and tags', async () => {
      const store = createTopicStore(adapter);

      // Set status
      await store.getState().setTopicStatus('networking/dns', 'learning');
      expect(store.getState().getTopicRecord('networking/dns').status).toBe('learning');

      // Set notes
      await store.getState().setTopicNotes('networking/dns', 'DNS records: A, CNAME, MX');
      expect(store.getState().getTopicRecord('networking/dns').notes).toBe('DNS records: A, CNAME, MX');

      // Add link
      await store.getState().addTopicLink('networking/dns', {
        title: 'DNS Explained',
        url: 'https://example.com/dns',
      });
      const links = store.getState().getTopicRecord('networking/dns').links;
      expect(links.length).toBe(1);
      expect(links[0].title).toBe('DNS Explained');

      // Remove link
      await store.getState().removeTopicLink('networking/dns', links[0].id);
      expect(store.getState().getTopicRecord('networking/dns').links.length).toBe(0);

      // Set tags
      await store.getState().setTopicTags('networking/dns', ['dns', 'networking']);
      expect(store.getState().getTopicRecord('networking/dns').tags).toEqual(['dns', 'networking']);
    });

    it('handles store export and import service methods', async () => {
      const store = createTopicStore(adapter);

      await store.getState().setTopicStatus('data/sharding', 'comfortable');
      await store.getState().setTopicNotes('data/sharding', 'Consistent hashing ring');

      const jsonDump = await store.getState().exportData();
      expect(jsonDump).toContain('data/sharding');
      expect(jsonDump).toContain('Consistent hashing ring');

      // Clear store
      await store.getState().clearData();
      expect(store.getState().topics['data/sharding']).toBeUndefined();

      // Re-import
      await store.getState().importData(jsonDump);
      expect(store.getState().topics['data/sharding'].status).toBe('comfortable');
      expect(store.getState().topics['data/sharding'].notes).toBe('Consistent hashing ring');
    });
  });
});
