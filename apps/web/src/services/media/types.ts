export interface MediaAsset {
  id: string;
  type: 'IMAGE';
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  altText?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  url: string;
  createdAt: string;
}

export interface ListMediaParams {
  status?: 'ACTIVE' | 'ARCHIVED';
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListMediaResponse {
  items: MediaAsset[];
  total: number;
  page: number;
  limit: number;
}

export interface RichMcqOption {
  key: string;            // 'A' | 'B' | 'C' | 'D'
  mode: OptionMode;
  text: string;
  mediaId: string | null;
  mediaUrl: string | null;
}

export type OptionMode = 'text-only' | 'diagram-only' | 'diagram-text';
