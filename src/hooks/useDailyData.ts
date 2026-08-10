import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { arrayMove } from '@dnd-kit/sortable';
import { db } from '../lib/dexieClient';
import { createEmptyDailyData, reconcileDay, scheduleSync } from '../lib/syncEngine';
import { useUiStore } from '../store/uiStore';
import type { DailyData, PlatformPost, Task } from '../types';

export interface DailyDataActions {
  addTask: (text: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  reorderTasks: (activeId: string, overId: string) => Promise<void>;
  setNotes: (notes: string) => Promise<void>;
  toggleSticker: (sticker: string) => Promise<void>;
  addPost: (post: Omit<PlatformPost, 'id'>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}
export interface UseDailyDataResult extends DailyDataActions { data: DailyData; isLoading: boolean }

/** Provides an offline-first daily record and optimistic mutation actions. */
export function useDailyData(userId: string, dateKey: string): UseDailyDataResult {
  const local = useLiveQuery(() => db.daily_data.get([userId, dateKey]), [userId, dateKey]);
  const query = useQuery({ queryKey: ['daily-data', userId, dateKey], queryFn: () => reconcileDay(userId, dateKey), enabled: Boolean(userId), retry: 1, staleTime: 30_000 });
  const data = local ?? query.data ?? createEmptyDailyData(userId, dateKey);

  const update = useCallback(async (transform: (current: DailyData) => DailyData) => {
    const current = (await db.daily_data.get([userId, dateKey])) ?? createEmptyDailyData(userId, dateKey);
    const next = { ...transform(current), updated_at: new Date().toISOString(), sync_pending: 1 as const };
    await db.daily_data.put(next);
    scheduleSync(next);
  }, [userId, dateKey]);

  const actions = useMemo<DailyDataActions>(() => ({
    addTask: async (text) => update((current) => ({ ...current, tasks: [...current.tasks, { id: crypto.randomUUID(), text: text.trim(), completed: false, order: current.tasks.length }] })),
    toggleTask: async (taskId) => update((current) => {
      const beforeIncomplete = current.tasks.filter((task) => !task.completed).length;
      const tasks = current.tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task);
      if (beforeIncomplete === 1 && tasks.every((task) => task.completed)) useUiStore.getState().celebrate();
      return { ...current, tasks };
    }),
    deleteTask: async (taskId) => update((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId).map((task, order) => ({ ...task, order })) })),
    reorderTasks: async (activeId, overId) => update((current) => {
      const from = current.tasks.findIndex((task) => task.id === activeId);
      const to = current.tasks.findIndex((task) => task.id === overId);
      if (from < 0 || to < 0) return current;
      return { ...current, tasks: arrayMove(current.tasks, from, to).map((task: Task, order: number) => ({ ...task, order })) };
    }),
    setNotes: async (notes) => update((current) => ({ ...current, notes })),
    toggleSticker: async (sticker) => update((current) => ({ ...current, stickers: current.stickers.includes(sticker) ? current.stickers.filter((item) => item !== sticker) : [...current.stickers, sticker] })),
    addPost: async (post) => update((current) => ({ ...current, platform_posts: [...current.platform_posts, { ...post, id: crypto.randomUUID() }] })),
    deletePost: async (postId) => update((current) => ({ ...current, platform_posts: current.platform_posts.filter((post) => post.id !== postId) })),
  }), [update]);

  return { data, isLoading: local === undefined && query.isLoading, ...actions };
}
