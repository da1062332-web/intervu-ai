export interface CreateTopic {
  name: string;
  code: string;
  description?: string | null;
  status?: string;
}

export interface UpdateTopic {
  name?: string;
  code?: string;
  description?: string | null;
  status?: string;
  isActive?: boolean; // backwards compatibility
}

export interface TopicDto {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Backwards compatibility legacy fields
  domain?: string;
  topicName?: string;
  subtopic?: string;
  tags?: string[];
  easySupport?: boolean;
  mediumSupport?: boolean;
  hardSupport?: boolean;
  isActive?: boolean;
  deletedAt?: string | Date | null;
}
