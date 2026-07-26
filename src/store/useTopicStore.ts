import { create } from 'zustand';
import { StorageAdapter, TopicStatus, UserLink, UserTopicRecord } from '../types/storage';
import { indexedDbAdapter } from '../storage/indexedDbAdapter';

export interface TopicStoreState {
  topics: Record<string, UserTopicRecord>;
  isHydrated: boolean;

  // Actions
  loadAllTopics: () => Promise<void>;
  getTopicRecord: (topicId: string) => UserTopicRecord;
  setTopicStatus: (topicId: string, status: TopicStatus) => Promise<void>;
  setTopicNotes: (topicId: string, notes: string) => Promise<void>;
  addTopicLink: (topicId: string, link: { title: string; url: string }) => Promise<void>;
  removeTopicLink: (topicId: string, linkId: string) => Promise<void>;
  setTopicTags: (topicId: string, tags: string[]) => Promise<void>;

  // Data Export / Import / Clear Service Methods
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  clearData: () => Promise<void>;
}

export const createDefaultTopicRecord = (topicId: string): UserTopicRecord => ({
  topicId,
  status: 'not_started',
  notes: '',
  links: [],
  tags: [],
  updatedAt: new Date().toISOString(),
});

export const createTopicStore = (adapter: StorageAdapter = indexedDbAdapter) => {
  return create<TopicStoreState>((set, get) => ({
    topics: {},
    isHydrated: false,

    loadAllTopics: async () => {
      const data = await adapter.getAll();
      set({ topics: data.topics, isHydrated: true });
    },

    getTopicRecord: (topicId: string) => {
      const { topics } = get();
      return topics[topicId] || createDefaultTopicRecord(topicId);
    },

    setTopicStatus: async (topicId: string, status: TopicStatus) => {
      const record = get().getTopicRecord(topicId);
      const updated: UserTopicRecord = {
        ...record,
        status,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        topics: {
          ...state.topics,
          [topicId]: updated,
        },
      }));

      await adapter.saveTopic(topicId, updated);
    },

    setTopicNotes: async (topicId: string, notes: string) => {
      const record = get().getTopicRecord(topicId);
      const updated: UserTopicRecord = {
        ...record,
        notes,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        topics: {
          ...state.topics,
          [topicId]: updated,
        },
      }));

      await adapter.saveTopic(topicId, updated);
    },

    addTopicLink: async (topicId: string, linkInput: { title: string; url: string }) => {
      const record = get().getTopicRecord(topicId);
      const newLink: UserLink = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        title: linkInput.title,
        url: linkInput.url,
        createdAt: new Date().toISOString(),
      };

      const updated: UserTopicRecord = {
        ...record,
        links: [...record.links, newLink],
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        topics: {
          ...state.topics,
          [topicId]: updated,
        },
      }));

      await adapter.saveTopic(topicId, updated);
    },

    removeTopicLink: async (topicId: string, linkId: string) => {
      const record = get().getTopicRecord(topicId);
      const updated: UserTopicRecord = {
        ...record,
        links: record.links.filter((l) => l.id !== linkId),
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        topics: {
          ...state.topics,
          [topicId]: updated,
        },
      }));

      await adapter.saveTopic(topicId, updated);
    },

    setTopicTags: async (topicId: string, tags: string[]) => {
      const record = get().getTopicRecord(topicId);
      const updated: UserTopicRecord = {
        ...record,
        tags,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        topics: {
          ...state.topics,
          [topicId]: updated,
        },
      }));

      await adapter.saveTopic(topicId, updated);
    },

    exportData: async () => {
      return await adapter.exportAll();
    },

    importData: async (json: string) => {
      await adapter.importAll(json);
      const refreshed = await adapter.getAll();
      set({ topics: refreshed.topics });
    },

    clearData: async () => {
      await adapter.clear();
      set({ topics: {} });
    },
  }));
};

export const useTopicStore = createTopicStore(indexedDbAdapter);
