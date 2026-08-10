# API Reference

## Hooks

### `useAuth(): AuthState`

Starts one Neon Auth session lookup and auth-state subscription. Returns `{ user, session, loading, setAuth, setLoading }` from `authStore`. The subscription is removed on unmount.

### `useDailyData(userId: string, dateKey: string): UseDailyDataResult`

Returns `{ data: DailyData, isLoading: boolean }` plus:

```ts
addTask(text: string): Promise<void>
toggleTask(taskId: string): Promise<void>
deleteTask(taskId: string): Promise<void>
reorderTasks(activeId: string, overId: string): Promise<void>
setNotes(notes: string): Promise<void>
toggleSticker(sticker: string): Promise<void>
addPost(post: Omit<PlatformPost, 'id'>): Promise<void>
deletePost(postId: string): Promise<void>
```

All actions are local-first and schedule a full-record cloud upsert. `dateKey` must be `yyyy-MM-dd`.

### `useSync(userId: string | undefined): void`

Flushes pending IndexedDB rows on mount and when the browser returns online. Sets the global sync state to offline if reconciliation fails.

### `useCalendar(): CalendarState & navigation`

Returns calendar store fields plus `previous(): void`, `next(): void`, and `goToday(): void`. Previous/next shift by a month or week according to `viewMode`.

## Stores

### `useAuthStore`

```ts
user: User | null
session: Session | null
loading: boolean
setAuth(session: Session | null): void
setLoading(loading: boolean): void
```

### `useCalendarStore`

```ts
currentDate: Date
selectedDateKey: string
viewMode: 'month' | 'week'
setCurrentDate(date: Date): void
selectDate(dateKey: string): void
setViewMode(mode: 'month' | 'week'): void
```

`currentDate` controls the visible period. `selectedDateKey` independently identifies the daily record.

### `useUiStore`

```ts
darkMode: boolean
syncState: 'synced' | 'syncing' | 'offline'
confetti: boolean
streak: number
toggleTheme(): void
setSyncState(state: SyncState): void
setStreak(count: number): void
celebrate(): void
stopCelebrating(): void
```

## Sync engine

```ts
createEmptyDailyData(userId: string, dateKey: string): DailyData
chooseNewest(local: DailyData | undefined, remote: DailyData): DailyData
reconcileDay(userId: string, dateKey: string): Promise<DailyData>
pushRecord(record: DailyData): Promise<DailyData>
scheduleSync(record: DailyData): void
flushPending(userId: string): Promise<void>
```

## Core types

```ts
interface Task { id: string; text: string; completed: boolean; order: number }
interface PlatformPost {
  id: string
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'pinterest'
  title: string
  status: 'draft' | 'scheduled' | 'published' | 'posted'
  notes: string
}
interface DailyData {
  id: string; user_id: string; date_key: string; tasks: Task[]; notes: string
  stickers: string[]; platform_posts: PlatformPost[]; updated_at: string
  sync_pending?: 0 | 1
}
```
