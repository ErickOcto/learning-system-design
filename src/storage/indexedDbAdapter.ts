import { get, set, del, clear as clearIdb } from 'idb-keyval';
import { StorageAdapter, UserDataExport, UserTopicRecord } from '../types/storage';

const STORAGE_KEY = 'system_design_user_topics_v1';

export class IndexedDbStorageAdapter implements StorageAdapter {
  private key: string;

  constructor(key: string = STORAGE_KEY) {
    this.key = key;
  }

  private async getTopicsMap(): Promise<Record<string, UserTopicRecord>> {
    try {
      const data = await get<Record<string, UserTopicRecord>>(this.key);
      return data || {};
    } catch (err) {
      console.error('Failed to read from IndexedDB:', err);
      return {};
    }
  }

  private async saveTopicsMap(topicsMap: Record<string, UserTopicRecord>): Promise<void> {
    try {
      await set(this.key, topicsMap);
    } catch (err) {
      console.error('Failed to save to IndexedDB:', err);
      throw err;
    }
  }

  async getAll(): Promise<UserDataExport> {
    const topics = await this.getTopicsMap();
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      topics,
    };
  }

  async getTopic(topicId: string): Promise<UserTopicRecord | null> {
    const topics = await this.getTopicsMap();
    return topics[topicId] || null;
  }

  async saveTopic(topicId: string, data: UserTopicRecord): Promise<void> {
    const topics = await this.getTopicsMap();
    topics[topicId] = {
      ...data,
      topicId,
      updatedAt: new Date().toISOString(),
    };
    await this.saveTopicsMap(topics);
  }

  async exportAll(): Promise<string> {
    const exportData = await this.getAll();
    return JSON.stringify(exportData, null, 2);
  }

  async importAll(json: string): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      throw new Error('Invalid JSON format');
    }

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('topics' in parsed) ||
      typeof (parsed as Record<string, unknown>).topics !== 'object'
    ) {
      throw new Error('Invalid export format: missing "topics" object');
    }

    const exportData = parsed as UserDataExport;
    const currentTopics = await this.getTopicsMap();

    // Merge imported topics with existing ones
    const mergedTopics: Record<string, UserTopicRecord> = {
      ...currentTopics,
      ...exportData.topics,
    };

    await this.saveTopicsMap(mergedTopics);
  }

  async clear(): Promise<void> {
    try {
      await del(this.key);
    } catch (err) {
      console.error('Failed to clear IndexedDB key:', err);
      await clearIdb();
    }
  }
}

export const indexedDbAdapter = new IndexedDbStorageAdapter();
