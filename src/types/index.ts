export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'pinterest' | 'x' | 'shorts' | 'reels' | 'newsletter' | 'podcast';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'posted';
export type ViewMode = 'month' | 'week';
export type SyncState = 'synced' | 'syncing' | 'offline';

export interface Task { id: string; text: string; completed: boolean; order: number }
export interface PlatformPost {
  id: string; platform: Platform; title: string; status: PostStatus; notes: string;
  idea_id?: string | null; script_id?: string | null; board_card_id?: string | null;
  caption?: string; content_type?: string; schedule_date?: string;
}
export interface DailyData {
  id: string;
  user_id: string;
  date_key: string;
  tasks: Task[];
  notes: string;
  stickers: string[];
  platform_posts: PlatformPost[];
  updated_at: string;
  sync_pending?: 0 | 1;
}
export interface Profile { id: string; username: string | null; avatar_url: string | null; settings: Record<string, unknown>; streak_count: number; last_visit: string | null; created_at: string }
export interface AppUser { id: string; email?: string; user_metadata: Record<string, unknown> }
export interface AppSession { user: AppUser; access_token?: string }
