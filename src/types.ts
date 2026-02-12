export interface NewsItem {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  imageUrl: string;
  position: number;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface GeneratedArticle {
  id: string;
  title: string;
  content: string;
  sourceUrl: string;
  generatedAt: string;
  status?: 'idle' | 'generating' | 'ready' | 'error';
  requestedAt?: number;
  completedAt?: number;
  errorMessage?: string;
}

export interface CopyState {
  [key: string]: boolean;
}