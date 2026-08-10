import { useState, type ReactElement } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { CHECKLIST_PRESETS, presetToItems } from '../../../data/checklistTemplates';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, Progress, confirmDelete } from '../shared/primitives';
import type { ProductionChecklist, ChecklistItem } from '../../../types/ugc';

interface Props { userId: string }

const CATEGORY_COLOR: Record<string, 'mint' | 'coral' | 'lavender' | 'peach' | 'sky' | 'yellow' | 'gray'> = { lighting: 'yellow', audio: 'sky', video: 'lavender', brand: 'mint', general: 'gray' };

/** PILLAR 2.5 — repeatable production checklists from top-creator pre-shoot rituals. */
export function Checklists({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('production_checklists', userId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [blankOpen, setBlankOpen] = useState(false);
  const [blankName, setBlankName] = useState('');
  const [blankItems, setBlankItems] = useState('');

  const createFromPreset = async (presetIndex: number): Promise<void> => {
    const preset = CHECKLIST_PRESETS[presetIndex];
    if (!preset) return;
    await add({ name: preset.name, category: preset.category, items: presetToItems(preset) } as never);
    setPickerOpen(false);
  };

  const createBlank = async (): Promise<void> => {
    if (!blankName.trim()) return;
    const items: ChecklistItem[] = blankItems.split('\n').map((text) => text.trim()).filter(Boolean).map((text) => ({ id: crypto.randomUUID(), text, checked: false }));
    await add({ name: blankName.trim(), category: 'general', items } as never);
    setBlankOpen(false); setBlankName(''); setBlankItems('');
  };

  const toggleItem = (list: ProductionChecklist, itemId: string): void => {
    void update(list.id, { items: list.items.map((item) => item.id === itemId ? { ...item, checked: !item.checked } : item) } as never);
  };

  const doneCount = (list: ProductionChecklist): number => list.items.filter((i) => i.checked).length;

  return <>
    <PageHead eyebrow="Pillar 2 · Studio" title="Checklists ✅" subtitle="Run the same pre-shoot, brand, and post-publish rituals every single time — nothing gets missed."
      actions={[
        <button key="blank" className="btn soft" onClick={() => setBlankOpen(true)}><Plus size={15}/> Blank</button>,
        <button key="preset" className="btn primary" onClick={() => setPickerOpen(true)}><Plus size={16}/> From template</button>,
      ]} />

    <section className="section-block">
      {items.length === 0 ? <EmptyState emoji="✅" title="No checklists yet" note="Start from a battle-tested template — lighting, audio, brand requirements, b-roll and more."/> :
        <div className="grid grid-2">{items.map((list) => {
          const total = list.items.length;
          const done = doneCount(list);
          const complete = total > 0 && done === total;
          return <div key={list.id} className="ugc-card" style={complete ? { outline: '2px solid var(--mint)' } : undefined}>
            <div className="card-topbar">
              <Pill color={CATEGORY_COLOR[list.category ?? ''] ?? 'gray'}>{list.category ?? 'general'}</Pill>
              <div className="row" style={{ gap: 6 }}>
                {complete && <Pill color="mint">done 🎉</Pill>}
                <button className="icon-btn" onClick={() => confirmDelete(() => void remove(list.id))} aria-label="Delete checklist"><Trash2 size={14}/></button>
              </div>
            </div>
            <h3 style={{ fontSize: 14.5, color: '#5d4f79', margin: '10px 0 8px' }}>{list.name}</h3>
            <Progress value={done} max={total} label={`${done}/${total} steps`} />
            <div className="mini-chips" style={{ marginTop: 12, display: 'grid', gap: 6 }}>
              {list.items.map((item) => (
                <button key={item.id} className={`check-item ${item.checked ? 'done' : ''}`} onClick={() => toggleItem(list, item.id)} aria-pressed={item.checked}>
                  <span className="check-box">{item.checked ? <Check size={11}/> : null}</span>
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          </div>;
        })}</div>}
    </section>

    {pickerOpen && <Modal title="Start from a template" onClose={() => setPickerOpen(false)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setPickerOpen(false)}>Cancel</button></div>}>
      <div className="grid grid-2" style={{ gap: 10 }}>
        {CHECKLIST_PRESETS.map((preset, idx) => (
          <button key={preset.name} className="ugc-card hoverable" style={{ textAlign: 'left' }} onClick={() => void createFromPreset(idx)}>
            <Pill color={CATEGORY_COLOR[preset.category] ?? 'gray'}>{preset.category}</Pill>
            <h3 style={{ fontSize: 14, color: '#5d4f79', margin: '8px 0 4px' }}>{preset.name}</h3>
            <p className="card-sub">{preset.items.length} steps</p>
          </button>
        ))}
      </div>
    </Modal>}

    {blankOpen && <Modal title="Custom checklist" onClose={() => setBlankOpen(false)}
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setBlankOpen(false)}>Cancel</button><button className="btn primary" onClick={() => void createBlank()}><Plus size={15}/> Create</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <Field label="Name *"><input className="input" value={blankName} onChange={(e) => setBlankName(e.target.value)} placeholder="e.g. Podcast setup"/></Field>
        <Field label="Steps (one per line)"><textarea className="textarea" rows={6} value={blankItems} onChange={(e) => setBlankItems(e.target.value)} placeholder={'Set mic levels\nArm lav to camera\nPrep guest chair'}/></Field>
      </div>
    </Modal>}
  </>;
}
