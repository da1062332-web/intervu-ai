export interface Topic {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicPayload {
  name: string;
  code: string;
  description?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateTopicPayload {
  name?: string;
  code?: string;
  description?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}
