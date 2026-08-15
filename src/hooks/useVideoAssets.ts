import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbUgc } from '../lib/dexieUgcClient';
import type { VideoAnalysis, VideoAsset } from '../types/video';

export interface UseVideoAssetsResult {
  items: VideoAsset[];
  isLoading: boolean;
  addVideo: (file: File) => Promise<VideoAsset>;
  setAnalyzing: (id: string) => Promise<void>;
  setAnalysisResult: (id: string, analysis: VideoAnalysis) => Promise<void>;
  setAnalysisError: (id: string, message: string) => Promise<void>;
  updateAnalysis: (id: string, patch: Partial<VideoAnalysis>) => Promise<void>;
  linkToIdea: (id: string, ideaId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** Device-only clip library — every clip and its AI analysis lives solely in IndexedDB. */
export function useVideoAssets(userId?: string): UseVideoAssetsResult {
  const local = useLiveQuery(
    () => (userId ? dbUgc.video_assets.where('user_id').equals(userId).reverse().sortBy('created_at') : Promise.resolve([] as VideoAsset[])),
    [userId],
  );
  const items = local ?? [];

  return useMemo(() => ({
    items,
    isLoading: local === undefined,
    addVideo: async (file: File): Promise<VideoAsset> => {
      if (!userId) throw new Error('Sign in to save clips.');
      const asset: VideoAsset = {
        id: crypto.randomUUID(),
        user_id: userId,
        created_at: new Date().toISOString(),
        file_name: file.name,
        mime_type: file.type || 'video/mp4',
        size_bytes: file.size,
        blob: file,
        status: 'idle',
        error_message: null,
        analysis: null,
        linked_idea_id: null,
      };
      await dbUgc.video_assets.put(asset);
      return asset;
    },
    setAnalyzing: async (id) => { await dbUgc.video_assets.update(id, { status: 'analyzing', error_message: null }); },
    setAnalysisResult: async (id, analysis) => { await dbUgc.video_assets.update(id, { status: 'ready', analysis, error_message: null }); },
    setAnalysisError: async (id, message) => { await dbUgc.video_assets.update(id, { status: 'error', error_message: message }); },
    updateAnalysis: async (id, patch) => {
      const current = await dbUgc.video_assets.get(id);
      if (!current?.analysis) return;
      await dbUgc.video_assets.update(id, { analysis: { ...current.analysis, ...patch } });
    },
    linkToIdea: async (id, ideaId) => { await dbUgc.video_assets.update(id, { linked_idea_id: ideaId }); },
    remove: async (id) => { await dbUgc.video_assets.delete(id); },
  }), [items, local, userId]);
}
