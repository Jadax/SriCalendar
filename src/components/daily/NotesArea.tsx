import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Check, Feather } from 'lucide-react';

interface NotesAreaProps { notes: string; onSave: (notes: string) => Promise<void> }
/** Edits free-form notes and saves after two seconds or when focus leaves. */
export function NotesArea({ notes, onSave }: NotesAreaProps): ReactElement {
  const [value, setValue] = useState(notes); const [saved, setSaved] = useState(true); const latestSaved = useRef(notes);
  useEffect(() => { setValue(notes); latestSaved.current = notes; setSaved(true); }, [notes]);
  useEffect(() => { if (value === latestSaved.current) return; setSaved(false); const timer = window.setTimeout(() => { void onSave(value); latestSaved.current = value; setSaved(true); }, 2000); return () => window.clearTimeout(timer); }, [value, onSave]);
  const blur = (): void => { if (value !== latestSaved.current) { void onSave(value); latestSaved.current = value; setSaved(true); } };
  return <section className="panel-section"><div className="section-title"><h3><Feather size={17}/> Notes & ideas</h3><span className={saved ? 'saved' : ''}>{saved ? <><Check size={13}/> Saved to cloud</> : 'Saving…'}</span></div><textarea value={value} onChange={(event) => setValue(event.target.value)} onBlur={blur} placeholder="Capture a caption, a thought, a tiny moment…" /></section>;
}
