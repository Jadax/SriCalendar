import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import { AlertTriangle, Clapperboard, Loader2, Save, Sparkles, Trash2, Upload, Video } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { useVideoAssets } from '../../../hooks/useVideoAssets';
import { analyzeVideo, isGeminiConfigured } from '../../../lib/geminiClient';
import { PLATFORM_META, cap } from '../../../data/options';
import { EmptyState, Field, FormRow, PageHead, Pill } from '../shared/primitives';
import type { VideoAsset } from '../../../types/video';

interface Props { userId: string }

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Turns a raw phone clip into a ready-to-post title/description/hashtags/hook via a free Gemini call. */
export function VideoAssistant({ userId }: Props): ReactElement {
  const video = useVideoAssets(userId);
  const ideas = useCollection('content_ideas', userId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const urlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => () => { for (const url of urlsRef.current.values()) URL.revokeObjectURL(url); }, []);

  const urlFor = (asset: VideoAsset): string => {
    let url = urlsRef.current.get(asset.id);
    if (!url) { url = URL.createObjectURL(asset.blob); urlsRef.current.set(asset.id, url); }
    return url;
  };

  const runAnalysis = async (asset: VideoAsset): Promise<void> => {
    await video.setAnalyzing(asset.id);
    try {
      const analysis = await analyzeVideo(asset.blob, asset.mime_type, asset.file_name);
      await video.setAnalysisResult(asset.id, analysis);
    } catch (error) {
      await video.setAnalysisError(asset.id, error instanceof Error ? error.message : 'Something went wrong analyzing this clip.');
    }
  };

  const ingestFiles = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('video/')) continue;
      const asset = await video.addVideo(file);
      if (isGeminiConfigured) void runAnalysis(asset);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>): void => { void ingestFiles(event.target.files); event.target.value = ''; };

  const saveToIdeaBank = async (asset: VideoAsset): Promise<void> => {
    if (!asset.analysis) return;
    const a = asset.analysis;
    await ideas.add({
      title: a.title,
      description: a.description,
      platform: a.platform_fit[0] ?? 'tiktok',
      priority: 'medium',
      effort_level: 'quick',
      status: 'idea',
      audience_promise: '',
      hook_idea: a.hook,
      content_angle: '',
      inspiration_source: '🤖 Video Assistant (Gemini)',
      pillar: a.suggested_pillar,
      repurpose_plan: '',
      impact: 3,
      confidence: 3,
    } as never);
    setSavedIds((prev) => ({ ...prev, [asset.id]: true }));
  };

  const sortedItems = useMemo(() => video.items, [video.items]);

  return <>
    <PageHead eyebrow="Pillar 2 · Studio" title="Video Assistant 🎬" subtitle="Drop in a clip from her phone — Gemini watches it and drafts the title, caption, hook, hashtags and tags in one go." />

    {!isGeminiConfigured && <section className="section-block">
      <div className="ugc-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={18} color="#b4642f" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ fontSize: 13.5 }}>AI analysis isn't set up yet</strong>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.55 }}>
            Clips will still save on this device, but auto title/tags need a free Google Gemini API key.
            Grab one at <strong>aistudio.google.com/apikey</strong> and add it as <code>VITE_GEMINI_API_KEY</code> in your <code>.env</code> file.
          </p>
        </div>
      </div>
    </section>}

    <section className="section-block">
      <label
        className="video-dropzone"
        data-dragover={dragOver}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); void ingestFiles(e.dataTransfer.files); }}
      >
        <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={onFileChange} style={{ display: 'none' }} />
        <Upload size={26} />
        <strong>Tap to record or choose a video</strong>
        <span className="muted" style={{ fontSize: 12 }}>Works straight from her phone's camera roll or camera. Videos stay on this device.</span>
        <button type="button" className="btn primary" onClick={() => fileInputRef.current?.click()}><Video size={15}/> Add a clip</button>
      </label>
    </section>

    <section className="section-block">
      {sortedItems.length === 0 ? <EmptyState emoji="🎬" title="No clips yet" note="Record on the phone, add it here, and let the AI draft the boring-but-important stuff." /> :
        <div className="grid grid-2">
          {sortedItems.map((asset) => (
            <div className="ugc-card" key={asset.id}>
              <video src={urlFor(asset)} controls preload="metadata" style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 260 }} />
              <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                <span className="muted" style={{ fontSize: 11 }}>{asset.file_name} · {formatSize(asset.size_bytes)}</span>
                <button className="icon-btn" aria-label="Delete clip" onClick={() => { if (window.confirm('Delete this clip forever? This cannot be undone.')) void video.remove(asset.id); }}><Trash2 size={14} /></button>
              </div>

              {asset.status === 'idle' && isGeminiConfigured && <button className="btn soft" style={{ marginTop: 10, width: '100%' }} onClick={() => void runAnalysis(asset)}><Sparkles size={14} /> Analyze with AI</button>}
              {asset.status === 'analyzing' && <div className="row" style={{ marginTop: 10, gap: 8, fontSize: 12.5, color: 'var(--muted)' }}><Loader2 size={14} className="spin" /> Watching your clip and drafting metadata…</div>}
              {asset.status === 'error' && <div style={{ marginTop: 10 }}>
                <p className="card-sub" style={{ color: '#c03a67' }}>⚠️ {asset.error_message}</p>
                <button className="btn ghost" onClick={() => void runAnalysis(asset)}>Retry analysis</button>
              </div>}

              {asset.status === 'ready' && asset.analysis && <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                <Field label="Title"><input className="input" value={asset.analysis.title} onChange={(e) => void video.updateAnalysis(asset.id, { title: e.target.value })} /></Field>
                <Field label="Description"><textarea className="textarea" value={asset.analysis.description} onChange={(e) => void video.updateAnalysis(asset.id, { description: e.target.value })} /></Field>
                <Field label="Hook"><input className="input" value={asset.analysis.hook} onChange={(e) => void video.updateAnalysis(asset.id, { hook: e.target.value })} /></Field>
                <FormRow>
                  <Field label="Pillar"><input className="input" value={asset.analysis.suggested_pillar} onChange={(e) => void video.updateAnalysis(asset.id, { suggested_pillar: e.target.value })} /></Field>
                  <Field label="Best platforms"><span className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{asset.analysis.platform_fit.map((p) => <Pill key={p} color={PLATFORM_META[p]?.color ?? 'lavender'}>{cap(p)}</Pill>)}</span></Field>
                </FormRow>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{asset.analysis.hashtags.map((h) => <Pill key={h} color="sky">#{h}</Pill>)}</div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{asset.analysis.tags.map((t) => <Pill key={t} color="gray">{t}</Pill>)}</div>
                <button className="btn primary" disabled={savedIds[asset.id]} onClick={() => void saveToIdeaBank(asset)}>
                  {savedIds[asset.id] ? <><Clapperboard size={15} /> Saved to Idea Bank</> : <><Save size={15} /> Save to Idea Bank</>}
                </button>
              </div>}
            </div>
          ))}
        </div>}
    </section>
  </>;
}
