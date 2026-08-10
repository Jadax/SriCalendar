import { useEffect, type ReactElement, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function Pill({ color = 'lavender', children }: { color?: 'mint' | 'coral' | 'lavender' | 'peach' | 'sky' | 'yellow' | 'gray'; children: ReactNode }): ReactElement {
  return <span className={`pill ${color}`}>{children}</span>;
}

export function PageHead({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }): ReactElement {
  return <div className="page-head"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{subtitle && <p className="subtitle">{subtitle}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function SectionBlock({ title, hint, actions, children, className }: { title?: string; hint?: string; actions?: ReactNode; children: ReactNode; className?: string }): ReactElement {
  return <section className={`section-block ${className ?? ''}`}>{title !== undefined && <div className="block-head"><h2>{title}</h2>{hint && <span className="hint">{hint}</span>}{actions}</div>}{children}</section>;
}

export function Field({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function EmptyState({ emoji, title, note }: { emoji: string; title: string; note?: string }): ReactElement {
  return <div className="empty-state"><div className="empty-emoji">{emoji}</div><p>{title}</p>{note && <small>{note}</small>}</div>;
}

export function Modal({ title, onClose, children, wide = false, footer }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }): ReactElement {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><button className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={16}/></button><div className="modal-head"><h3>{title}</h3></div>{children}{footer && <div className="modal-footer">{footer}</div>}</div></div>;
}

export function SubTabs<T extends string>({ tabs, active, onChange }: { tabs: Array<{ id: T; label: string; icon?: string }>; active: T; onChange: (id: T) => void }): ReactElement {
  return <div className="subtabs">{tabs.map((tab) => <button key={tab.id} className={`subtab ${active === tab.id ? 'active' : ''}`} onClick={() => onChange(tab.id)}>{tab.icon && <span>{tab.icon}</span>}{tab.label}</button>)}</div>;
}

export function StatCard({ label, value, note, emoji }: { label: string; value: string; note?: string; emoji?: string }): ReactElement {
  return <div className="stat-card"><div className="stat-label">{emoji && <span>{emoji}</span>}{label}</div><div className="stat-value">{value}</div>{note && <div className="stat-note">{note}</div>}</div>;
}

export function Progress({ value, max = 100, label }: { value: number; max?: number; label?: string }): ReactElement {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return <div><div className="row" style={{ justifyContent: 'space-between' }}>{label && <span className="muted" style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>}<span className="muted" style={{ fontSize: 10.5, fontWeight: 700 }}>{Math.round(pct)}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }}/></div></div>;
}

export function confirmDelete(onConfirm: () => void): void {
  if (window.confirm('Delete this forever? This cannot be undone.')) onConfirm();
}

export function FormRow({ children }: { children: ReactNode }): ReactElement {
  return <div className="field-row">{children}</div>;
}