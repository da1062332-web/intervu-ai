export interface CreateTopic {
  domain: string;
  topicName: string;
  subtopic: string;
  tags: string[];
  easySupport: boolean;
  mediumSupport: boolean;
  hardSupport: boolean;
}

export interface UpdateTopic {
  domain?: string;
  topicName?: string;
  subtopic?: string;
  tags?: string[];
  easySupport?: boolean;
  mediumSupport?: boolean;
  hardSupport?: boolean;
  isActive?: boolean;
}

export interface TopicDto extends CreateTopic {
  id: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}
