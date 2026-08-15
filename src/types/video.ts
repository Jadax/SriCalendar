/** A phone clip stored entirely on-device (IndexedDB) — never synced to Neon. */
export interface VideoAsset {
  id: string;
  user_id: string;
  created_at: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  blob: Blob;
  status: 'idle' | 'analyzing' | 'ready' | 'error';
  error_message: string | null;
  analysis: VideoAnalysis | null;
  linked_idea_id: string | null;
}

/** Structured output the AI returns after watching a clip. */
export interface VideoAnalysis {
  title: string;
  description: string;
  hook: string;
  hashtags: string[];
  tags: string[];
  suggested_pillar: string;
  platform_fit: string[];
}
