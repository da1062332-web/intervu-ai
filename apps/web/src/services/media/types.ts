export interface MediaAsset {
  id: string;
  type: 'IMAGE' | 'SVG';
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  altText?: string;
  svgContent?: string;
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

export type OptionMode =
  | 'text-only'
  | 'diagram-only'
  | 'diagram-text'
  | 'svg-code'
  | 'svg-text';

export interface RichMcqOption {
  key: string;            // 'A' | 'B' | 'C' | 'D'
  mode: OptionMode;
  text: string;
  mediaId: string | null;
  mediaUrl: string | null;
  svgCode?: string | null;
}
