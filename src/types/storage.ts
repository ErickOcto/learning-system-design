export type TopicStatus = 'not_started' | 'learning' | 'comfortable' | 'mastered';

export interface UserLink {
  id: string;          // nanoid or random UUID
  title: string;       // user-editable
  url: string;
  createdAt: string;   // ISO 8601 string
}

export interface UserTopicRecord {
  topicId: string;     // matches route, e.g. 'foundations/scaling'
  status: TopicStatus;
  notes: string;       // markdown text
  links: UserLink[];
  tags: string[];
  updatedAt: string;   // ISO 8601 string
}

export interface UserDataExport {
  version: '1.0';
  exportedAt: string;
  topics: Record<string, UserTopicRecord>;
}

export interface SavedArchitecture {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  graph: {
    nodes: any[];
    edges: any[];
  };
}

export interface StorageAdapter {
  getAll(): Promise<UserDataExport>;
  getTopic(topicId: string): Promise<UserTopicRecord | null>;
  saveTopic(topicId: string, data: UserTopicRecord): Promise<void>;
  exportAll(): Promise<string>;      // JSON string
  importAll(json: string): Promise<void>;
  clear(): Promise<void>;

  // Playground Architecture Persistence
  getSavedArchitectures(): Promise<SavedArchitecture[]>;
  saveArchitecture(arch: SavedArchitecture): Promise<void>;
  deleteArchitecture(id: string): Promise<void>;
}
