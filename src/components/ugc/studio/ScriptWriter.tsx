import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Brain, Clapperboard, ClipboardCopy, FilePlus2, Film, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { HOOK_CATEGORIES, HOOK_TEMPLATES } from '../../../data/hookTemplates';
import { PLATFORMS, cap, alpha } from '../../../data/options';
import { generateScene, NICHES, type SceneFormula } from '../../../data/sceneFormulas';
import { buildBrain, type BrainResult } from '../../../lib/scriptBrain';
import { Teleprompter } from './Teleprompter';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, cx } from '../shared/primitives';
import type { HookItem, Script } from '../../../types/ugc';

interface Props { userId: string }

/** PILLAR 2.2 — Script writer with autosave, hook shelf, teleprompter and AI scene generator. */
export function ScriptWriter({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('scripts', userId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sceneOpen, setSceneOpen] = useState(false);
  const selected = items.find((script) => script.id === selectedId) ?? null;

  const sorted = useMemo(() => [...items].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [items]);

  const createScript = async (): Promise<void> => {
    await add({ title: 'Untitled script', content: '', niche: null, hook_template_used: null, platform_target: null, status: 'draft', word_count: 0, runtime_seconds: 0 } as never);
  };

  const showScene = (): void => { if (selected) setSceneOpen(true); };

  return <>
    <PageHead eyebrow="Pillar 2 · Studio" title="Script writer ✍️" subtitle="Markdown-friendly, auto-saving, runnable in teleprompter mode."
      actions={[<button key="scene" className="btn soft" onClick={showScene} disabled={!selected}><Sparkles size={15}/> AI scene generator</button>, <button key="add" className="btn primary" onClick={() => void createScript()}><FilePlus2 size={16}/> New script</button>]} />

    <div className="script-layout" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 16, alignItems: 'start' }}>
      <section className="section-block" style={{ padding: 14, position: 'sticky', top: 78, maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' }}>
        <div className="block-head" style={{ marginBottom: 10 }}><h2 style={{ fontSize: 15 }}>My scripts</h2></div>
        <div className="timeline" style={{ gap: 8 }}>
          {sorted.length === 0 && <p className="muted" style={{ fontSize: 12 }}>No scripts yet.</p>}
          {sorted.map((script) => (
            <div key={script.id} className="tl-item">
              <span className="tl-dot" style={{ background: selectedId === script.id ? 'rgba(245,79,134,.25)' : undefined }}>📄</span>
              <div className="tl-body" style={{ cursor: 'pointer' }} onClick={() => setSelectedId(script.id)}>
                <button className="card-title" style={{ border: 0, background: 'transparent', textAlign: 'left', fontSize: 13, fontWeight: 800, color: selectedId === script.id ? '#c03a67' : '#5d4f79', width: '100%' }}>{script.title}</button>
                <Pill color={script.status === 'published' ? 'mint' : script.status === 'ready' ? 'lavender' : 'gray'}>{script.status}</Pill>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected
        ? <ScriptEditor key={selected.id} userId={userId} script={selected} onDelete={() => { void remove(selected.id); setSelectedId(null); }} />
        : <section className="section-block"><EmptyState emoji="📝" title="Pick or create a script" note="Open a script to start writing. Hooks from the shelf can be dropped straight into the page with one click."/></section>}
    </div>

    {sceneOpen && selected && <SceneGeneratorModal niche={selected.niche ?? ''} topic={selected.title} onInsert={(block) => { void update(selected.id, { content: `${selected.content}\n\n${block}\n` } as never); setSceneOpen(false); }} onClose={() => setSceneOpen(false)} />}
  </>;
}

interface EditorProps { script: Script; onDelete: () => void; userId: string }

function ScriptEditor({ script, onDelete, userId }: EditorProps): ReactElement {
  const { update } = useCollection('scripts', script.user_id);
  const { items: myHooks } = useCollection('hook_library', userId);
  const [draft, setDraft] = useState(script.content);
  const [saved, setSaved] = useState(true);
  const [tpOpen, setTpOpen] = useState(false);
  const [coPilotOpen, setCoPilotOpen] = useState(false);
  const [shelfFilter, setShelfFilter] = useState('All');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedRef = useRef('');

  const words = useMemo(() => {
    const clean = draft.trim();
    return clean ? clean.split(/\s+/).length : 0;
  }, [draft]);
  const runtime = Math.max(1, Math.round((words / 140) * 60));
  const introIssue = words > 0 && !/(what|how|why|the|do|if|stop|you|i|nobody|everything|this|post|pov|one|1)/i.test(draft.slice(0, 6));

  useEffect(() => {
    lastSavedRef.current = script.content;
    setDraft(script.content);
  }, [script.content]);

  useEffect(() => {
    if (draft === lastSavedRef.current) { setSaved(true); return; }
    setSaved(false);
    const t = window.setTimeout(() => {
      lastSavedRef.current = draft;
      void update(script.id, { content: draft, word_count: words, runtime_seconds: runtime } as never);
      setSaved(true);
    }, 700);
    return () => window.clearTimeout(t);
  }, [draft, update, script.id, words, runtime]);

  const insertAtCursor = (text: string): void => {
    const ta = taRef.current;
    if (!ta) { setDraft((d) => `${d}\n\n${text}\n`); return; }
    const start = ta.selectionStart ?? draft.length;
    const next = `${draft.slice(0, start)}\n${text}\n${draft.slice(ta.selectionEnd ?? start)}`;
    setDraft(next);
    requestAnimationFrame(() => { ta.focus(); const pos = start + text.length + 2; ta.setSelectionRange(pos, pos); });
  };

  const shelf = useMemo(() => HOOK_TEMPLATES.filter((h) => shelfFilter === 'All' || h.category === shelfFilter), [shelfFilter]);

  return <section className="section-block">
    <div className="block-head" style={{ flexWrap: 'wrap', gap: 10 }}>
      <div style={{ display: 'grid', gap: 8, flex: 1, minWidth: 220 }}>
        <input className="input" style={{ fontSize: 17, fontWeight: 800 }} value={script.title} onChange={(e) => void update(script.id, { title: e.target.value } as never)} aria-label="Script title" />
        <FormRow>
          <Field label="Niche"><input className="input" value={script.niche ?? ''} onChange={(e) => void update(script.id, { niche: e.target.value } as never)} placeholder="beauty, tech…"/></Field>
          <Field label="Platform"><select className="select" value={script.platform_target ?? ''} onChange={(e) => void update(script.id, { platform_target: e.target.value } as never)}><option value="">Any</option>{alpha(PLATFORMS).map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
          <Field label="Status"><select className="select" value={script.status} onChange={(e) => void update(script.id, { status: e.target.value } as never)}><option value="draft">Draft</option><option value="ready">Ready to film</option><option value="filming">Filming</option><option value="published">Published</option></select></Field>
        </FormRow>
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="row" style={{ gap: 6 }}>
          <span className="word-count">✍️ {words} words · ~{Math.floor(runtime / 60)}:{String(runtime % 60).padStart(2, '0')} min</span>
          <span className="word-count" style={{ color: saved ? '#55977e' : '#c07b2f' }}>{saved ? 'Saved ✓' : 'Saving…'}</span>
        </div>
        <button className="btn soft" onClick={() => setTpOpen(true)}><Film size={15}/> Teleprompter</button>
        <button className="btn primary" onClick={() => setCoPilotOpen(true)}><Brain size={15}/> AI co-pilot</button>
        <button className="btn ghost" onClick={onDelete}><Trash2 size={15}/> Delete</button>
      </div>
    </div>

    {introIssue && <div className="row" style={{ margin: '10px 0', padding: '10px 13px', borderRadius: 13, background: 'rgba(255,224,140,.35)', fontSize: 12, fontWeight: 700, color: '#8a6d1a' }}>⚠️ Intro analyzer: most scripts dive straight into the hook. Consider opening with the payoff, not a greeting.</div>}

    <div className="script-split">
      <textarea ref={taRef} className="textarea" style={{ minHeight: 460, fontFamily: 'Nunito', fontSize: 15, lineHeight: 1.65 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={'Start with your opening hook…\n\nTip: [BR] marks b-roll, [TH] marks talking head.\n'}/>

      <aside className="hook-shelf">
        <div className="block-head" style={{ marginBottom: 6 }}><h2 style={{ fontSize: 13 }}>Hook shelf</h2></div>
        <select className="select" value={shelfFilter} onChange={(e) => setShelfFilter(e.target.value)} aria-label="Filter hooks"><option>All</option>{alpha(HOOK_CATEGORIES).map((c) => <option key={c}>{c}</option>)}</select>
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          {shelf.map((hook) => <button key={hook.text} className="hook-shelf-item" onClick={() => { insertAtCursor(`[HOOK ${hook.category}] ${hook.text}`); }}><span className="hs-type">{hook.category}</span>{hook.text}</button>)}
        </div>
      </aside>
    </div>

    {tpOpen && <Teleprompter open={tpOpen} content={draft} title={script.title} onClose={() => setTpOpen(false)} />}
    {coPilotOpen && <CoPilotModal script={{ ...script, content: draft }} myHooks={myHooks} onInsert={(text) => insertAtCursor(text)} onClose={() => setCoPilotOpen(false)} />}
  </section>;
}

function SceneGeneratorModal({ niche, topic, onInsert, onClose }: { niche: string; topic: string; onInsert: (block: string) => void; onClose: () => void }): ReactElement {
  const [nicheSel, setNicheSel] = useState(NICHES.includes(niche) ? niche : 'General');
  const [topicValue, setTopicValue] = useState(topic);
  const [scene, setScene] = useState<SceneFormula | null>(null);
  const generate = (): void => setScene(generateScene(nicheSel, topicValue || 'your topic'));

  return <Modal title="🎬 AI scene generator" onClose={onClose} wide
    footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={onClose}>Close</button>{scene && <button className="btn primary" onClick={() => onInsert(sceneBlock(scene))}><Plus size={15}/> Add scene to script</button>}</div>}>
    <FormRow>
      <Field label="Niche"><select className="select" value={nicheSel} onChange={(e) => setNicheSel(e.target.value)}>{alpha(NICHES).map((n) => <option key={n}>{n}</option>)}</select></Field>
      <Field label="Topic"><input className="input" value={topicValue} onChange={(e) => setTopicValue(e.target.value)} placeholder="e.g. 3-reel blueprints"/></Field>
      <div className="field"><button className="btn soft" style={{ alignSelf: 'end' }} onClick={generate}><Wand2 size={15}/> Generate scene</button></div>
    </FormRow>
    {scene ? <div className="section-block" style={{ marginTop: 14 }}>
      <div className="block-head"><h2 style={{ fontSize: 16 }}>{scene.title}</h2><Pill color="lavender">cinematic beat</Pill></div>
      <div className="grid" style={{ gap: 10 }}>
        {[['🎥 Opening', scene.opening], ['📈 Escalation', scene.escalation], ['💥 Payoff', scene.payoff]].map(([label, text]) => <div key={label as string}><div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--coral)', marginBottom: 3 }}>{label}</div><p style={{ fontSize: 13, color: '#554b6b', lineHeight: 1.55 }}>{text}</p></div>)}
        <div><div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--coral)', marginBottom: 3 }}>B-roll to capture</div><div className="mini-chips">{scene.broll.map((b, i) => <span key={`${b}-${i}`} className="chip">🎞️ {b}</span>)}</div></div>
      </div>
    </div> : <EmptyState emoji="🎬" title="Tap Generate scene" note="Blends camera moves, grading, and b-roll beats into a shootable cinematic sequence."/>}
  </Modal>;
}

function sceneBlock(scene: SceneFormula): string {
  return `## SCENE — ${scene.title}\nOpening: ${scene.opening}\nEscalation: ${scene.escalation}\nPayoff: ${scene.payoff}\nB-roll: ${scene.broll.join(', ')}`;
}

function CoPilotModal({ script, myHooks, onInsert, onClose }: { script: Script; myHooks: HookItem[]; onInsert: (text: string) => void; onClose: () => void }): ReactElement {
  const [copied, setCopied] = useState('');
  const brain: BrainResult = useMemo(() => buildBrain({
    niche: script.niche ?? '',
    topic: script.title.replace(/^untitled /i, '') === 'script' ? script.title : script.title,
    platform: script.platform_target ?? 'tiktok',
    content: script.content ?? '',
  }, myHooks), [script.title, script.niche, script.platform_target, script.content, myHooks]);

  const copy = async (label: string, text: string): Promise<void> => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopied(label);
    window.setTimeout(() => setCopied((c) => (c === label ? '' : c)), 1400);
  };

  return <Modal title="🧠 AI co-pilot · Script Writer" onClose={onClose} wide
    footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={onClose}>Close</button></div>}>
    <div className="grid" style={{ gap: 16 }}>
      <div className="section-block" style={{ margin: 0 }}>
        <div className="block-head"><h2 style={{ fontSize: 16 }}>🎣 Best hooks for this script</h2><span className="hint">scored for your platform + niche</span></div>
        <div className="grid" style={{ gap: 8 }}>
          {brain.hooks.map((h, i) => <div key={h.text} className="ugc-card" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span className="score hot">Top {i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Pill color={i === 0 ? 'coral' : 'lavender'}>{h.category}</Pill>
              <p style={{ fontSize: 13, color: '#554b6b', lineHeight: 1.45, margin: '6px 0 4px' }}>{h.text}</p>
              <p className="muted" style={{ fontSize: 10.5 }}>{h.reason}</p>
            </div>
            <button className="btn small soft" style={{ flex: 'none' }} onClick={() => onInsert(`[HOOK ${h.category}] ${h.text}`)}><Plus size={13}/> Insert</button>
          </div>)}
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 12 }}>
        <div className="ugc-card">
          <div className="card-topbar"><strong className="card-title">💬 Caption</strong><button className="icon-btn" onClick={() => void copy('caption', brain.caption)} aria-label="Copy caption"><ClipboardCopy size={13}/></button></div>
          <p className="muted" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5 }}>{brain.caption}{copied === 'caption' && <span style={{ color: '#55977e', fontWeight: 700 }}> copied</span>}</p>
        </div>
        <div className="ugc-card">
          <div className="card-topbar"><strong className="card-title">👋 Call to action</strong><button className="icon-btn" onClick={() => void copy('cta', brain.cta)} aria-label="Copy CTA"><ClipboardCopy size={13}/></button></div>
          <p className="muted" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5 }}>{brain.cta}{copied === 'cta' && <span style={{ color: '#55977e', fontWeight: 700 }}> copied</span>}</p>
        </div>
      </div>

      <div className="ugc-card">
        <div className="card-topbar"><strong className="card-title">🧱 Best structure arc</strong><Pill color="mint">{brain.structure.name}</Pill></div>
        <p className="muted" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6 }}>{brain.structure.body}</p>
      </div>

      <div className="section-block" style={{ margin: 0 }}>
        <div className="block-head"><h2 style={{ fontSize: 16 }}>📦 Upload kit</h2><span className="hint">grab the title, tags, description</span></div>
        <div className="grid" style={{ gap: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--coral)', marginBottom: 6 }}>Ideal titles</div>
            <div className="grid" style={{ gap: 6 }}>{brain.titles.map((t) => <div key={t} className="chip" style={{ justifyContent: 'space-between' }}>{t}<button onClick={() => void copy(`title-${t}`, t)} aria-label="Copy title"><ClipboardCopy size={12}/>{copied === `title-${t}` ? ' ✓' : ''}</button></div>)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--coral)', marginBottom: 6 }}>Tags</div>
            <div className="mini-chips">{brain.tags.map((t) => <span key={t} className="chip">#{t}</span>)}<button className="icon-btn" style={{ marginLeft: 6 }} onClick={() => void copy('tags', brain.tags.map((t) => `#${t}`).join(' '))} aria-label="Copy tags"><ClipboardCopy size={13}/></button></div>
          </div>
          <div>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--coral)' }}>Description</span><button className="btn small ghost" onClick={() => void copy('desc', brain.description)}><ClipboardCopy size={12}/> Copy</button></div>
            <p className="ugc-card" style={{ fontSize: 12, color: '#554b6b', lineHeight: 1.55 }}>{brain.description}</p>
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--coral)', marginBottom: 6 }}>Editing notes</div>
            <div className="grid" style={{ gap: 6 }}>{brain.editingNotes.map((n, i) => <p key={i} className="card-sub" style={{ margin: 0, fontSize: 11.5, display: 'flex', gap: 7 }}><span style={{ color: 'var(--coral)' }}>›</span>{n}</p>)}</div>
          </div>
        </div>
      </div>
    </div>
  </Modal>;
}