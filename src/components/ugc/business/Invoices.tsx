import { useMemo, useState, type ReactElement } from 'react';
import { Download, Eye, FilePlus2, Pencil, Printer, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, confirmDelete } from '../shared/primitives';
import { CURRENCIES, INCOME_STREAMS, formatMoney } from '../../../utils/money';
import { alphaBy } from '../../../data/options';
import type { Invoice, InvoiceLineItem } from '../../../types/ugc';

interface Props { userId: string }

const emptyLine = (): InvoiceLineItem => ({ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 });

const blankDraft = (): Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({
  invoice_number: '', brand_deal_id: null, client_note: '', recipient_name: '', recipient_email: '',
  issue_date: new Date().toISOString().slice(0, 10), due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  line_items: [emptyLine()], subtotal: 0, tax: 0, total: 0, status: 'draft', currency: 'USD', stream: 'brand-deal',
});

/** PILLAR 3.3 — invoice generator with live preview, print and PDF export. */
export function Invoices({ userId }: Props): ReactElement {
  const invoices = useCollection('invoices', userId);
  const deals = useCollection('brand_deals', userId);
  const [draft, setDraft] = useState<Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  const sorted = useMemo(() => [...invoices.items].sort((a, b) => (a.invoice_number < b.invoice_number ? 1 : -1)), [invoices.items]);
  const dealById = new Map(deals.items.map((d) => [d.id, d]));

  const computed = useMemo(() => {
    if (!draft) return null;
    const subtotal = (draft.line_items ?? []).reduce((sum, item) => sum + ((item.quantity ?? 0) * (item.rate ?? 0)), 0);
    const tax = Math.round(subtotal * 10) / 100;
    return { subtotal, tax, total: subtotal + tax };
  }, [draft]);

  const openNew = (): void => {
    const year = new Date().getFullYear();
    const nums = invoices.items.map((i) => parseInt(i.invoice_number.split('-').pop() ?? '0', 10)).filter((n) => !Number.isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    setDraft({ ...blankDraft(), invoice_number: `INV-${year}-${String(next).padStart(4, '0')}` });
    setEditorId(null);
  };

  const save = async (): Promise<void> => {
    if (!draft) return;
    if (!draft.recipient_name && !draft.line_items.some((l) => l.description.trim())) { return; }
    const totals = computed ?? { subtotal: 0, tax: 0, total: 0 };
    const clean: typeof draft = { ...draft, subtotal: totals.subtotal, tax: totals.tax, total: totals.total, line_items: draft.line_items.filter((l) => l.description.trim() || l.rate > 0) };
    if (editorId) await invoices.update(editorId, clean as never);
    else await invoices.add(clean as never);
    setDraft(null); setEditorId(null);
  };

  const downloadPdf = async (invoice: Invoice): Promise<void> => {
    setShowPdf(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { InvoicePdf } = await import('./InvoicePdf');
      const blob = await pdf(InvoicePdf({ invoice, brandName: dealById.get(invoice.brand_deal_id ?? '')?.brand_name ?? invoice.recipient_name })).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch { /* fall through to print */ }
  };

  const printInvoice = (invoice: Invoice): void => {
    setPreview(invoice);
    window.setTimeout(() => window.print(), 120);
  };

  return <>
    <PageHead eyebrow="Pillar 3 · Business" title="Invoices 🧾" subtitle="Auto-numbered, deal-linked, live-preview PDFs that get you paid."
      actions={[<button key="add" className="btn primary" onClick={openNew}><FilePlus2 size={16}/> New invoice</button>]} />

    {sorted.length === 0 ? <section className="section-block"><EmptyState emoji="🧾" title="No invoices yet" note="Create one from an accepted deal or from scratch. Totals, tax and numbers compute themselves."/></section> :
      <section className="section-block">
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Number</th><th>Bill to</th><th>Issued</th><th>Due</th><th>Total</th><th>Status</th><th /></tr></thead><tbody>{sorted.map((invoice) => (
          <tr key={invoice.id}>
            <td><strong>{invoice.invoice_number}</strong></td>
            <td>{invoice.recipient_name || dealById.get(invoice.brand_deal_id ?? '')?.brand_name || '·'}</td>
            <td>{invoice.issue_date}</td>
            <td>{invoice.due_date}</td>
            <td>{formatMoney(invoice.total ?? 0, invoice.currency)}</td>
            <td><Pill color={invoice.status === 'paid' ? 'mint' : invoice.status === 'overdue' ? 'coral' : invoice.status === 'sent' ? 'lavender' : 'gray'}>{invoice.status}</Pill></td>
            <td><div className="row" style={{ gap: 6 }}>
              <button className="icon-btn" title="Preview" onClick={() => setPreview(invoice)}><Eye size={15}/></button>
              <button className="icon-btn" title="Edit" onClick={() => { setEditorId(invoice.id); setDraft({ ...invoice }); }}>✏️</button>
              <button className="icon-btn" title="Download PDF" onClick={() => void downloadPdf(invoice)}><Download size={15}/></button>
              <button className="icon-btn" title="Print" onClick={() => { const ids = sorted.map((i) => i.id); const idx = ids.indexOf(invoice.id); printInvoice(sorted[idx] ?? invoice); }}><Printer size={15}/></button>
              <button className="icon-btn" title="Delete" onClick={() => confirmDelete(() => void invoices.remove(invoice.id))}><Trash2 size={14}/></button>
            </div></td>
          </tr>
        ))}</tbody></table></div>
      </section>}

    {draft && <Modal title={editorId ? 'Edit invoice' : 'New invoice'} onClose={() => setDraft(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setDraft(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>Save invoice</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Invoice number"><input className="input" value={draft.invoice_number} onChange={(e) => setDraft({ ...draft, invoice_number: e.target.value })}/></Field>
          <Field label="Link to brand deal"><select className="select" value={draft.brand_deal_id ?? ''} onChange={(e) => { const id = e.target.value || null; const deal = id ? dealById.get(id) : null; setDraft({ ...draft, brand_deal_id: id, recipient_name: deal?.brand_name ?? draft.recipient_name, recipient_email: deal?.contact_email ?? draft.recipient_email, currency: deal?.currency ?? draft.currency }); }}><option value="">None</option>{deals.items.map((d) => <option key={d.id} value={d.id}>{d.brand_name}</option>)}</select></Field>
        </FormRow>
        <FormRow>
          <Field label="Bill to (company / person)"><input className="input" value={draft.recipient_name ?? ''} onChange={(e) => setDraft({ ...draft, recipient_name: e.target.value })}/></Field>
          <Field label="Client email"><input type="email" className="input" value={draft.recipient_email ?? ''} onChange={(e) => setDraft({ ...draft, recipient_email: e.target.value })}/></Field>
        </FormRow>
        <FormRow>
          <Field label="Issue date"><input type="date" className="date-input" value={draft.issue_date} onChange={(e) => setDraft({ ...draft, issue_date: e.target.value })}/></Field>
          <Field label="Due date"><input type="date" className="date-input" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}/></Field>
          <Field label="Status"><select className="select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="draft">Draft</option><option value="sent">Sent</option><option value="overdue">Overdue</option><option value="paid">Paid</option></select></Field>
        </FormRow>
        <FormRow>
          <Field label="Currency"><select className="select" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })}>{alphaBy(CURRENCIES, (c) => c.name).map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code} · {c.name}</option>)}</select></Field>
          <Field label="Income stream"><select className="select" value={draft.stream ?? 'brand-deal'} onChange={(e) => setDraft({ ...draft, stream: e.target.value })}>{alphaBy(INCOME_STREAMS, (s) => s.label).map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}</select></Field>
        </FormRow>

        <div>
          <div className="block-head"><h2 style={{ fontSize: 14 }}>Line items</h2></div>
          <div className="grid" style={{ gap: 8 }}>
            {(draft.line_items ?? []).map((item, idx) => (
              <div key={item.id} className="field-row" style={{ gridTemplateColumns: '1fr 70px 110px 36px' }}>
                <input className="input" placeholder="Description (e.g. 1 Reel + posting)" value={item.description} onChange={(e) => setDraft({ ...draft, line_items: (draft.line_items ?? []).map((li, i) => (i === idx ? { ...li, description: e.target.value } : li)) })}/>
                <input type="number" className="input" min={0} value={item.quantity} onChange={(e) => setDraft({ ...draft, line_items: (draft.line_items ?? []).map((li, i) => (i === idx ? { ...li, quantity: Number(e.target.value) } : li)) })} aria-label="Quantity"/>
                <input type="number" className="input" min={0} value={item.rate} onChange={(e) => setDraft({ ...draft, line_items: (draft.line_items ?? []).map((li, i) => (i === idx ? { ...li, rate: Number(e.target.value) } : li)) })} aria-label="Rate"/>
                <button className="icon-btn" onClick={() => setDraft({ ...draft, line_items: (draft.line_items ?? []).filter((li, i) => i !== idx) })} aria-label="Remove line"><Trash2 size={14}/></button>
              </div>
            ))}
            <button className="btn small ghost" style={{ justifySelf: 'start' }} onClick={() => setDraft({ ...draft, line_items: [...(draft.line_items ?? []), emptyLine()] })}>+ Add line</button>
          </div>
        </div>
        <FormRow>
          <Field label="Subtotal"><input className="input" value={formatMoney(computed?.subtotal ?? 0, draft.currency)} disabled/></Field>
          <Field label="Tax (10%)"><input className="input" value={formatMoney(computed?.tax ?? 0, draft.currency)} disabled/></Field>
          <Field label="Total"><input className="input" style={{ fontWeight: 800 }} value={formatMoney(computed?.total ?? 0, draft.currency)} disabled/></Field>
        </FormRow>
        <Field label="Client note"><input className="input" value={draft.client_note ?? ''} onChange={(e) => setDraft({ ...draft, client_note: e.target.value })} placeholder="Thanks + payment terms…"/></Field>
      </div>
    </Modal>}

    {preview && <Modal title={preview.invoice_number} onClose={() => setPreview(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <select className="select" style={{ width: 120 }} value={preview.status} onChange={(e) => { void invoices.update(preview.id, { status: e.target.value }); const fresh = { ...preview, status: e.target.value }; setPreview(fresh); }}>
          <option value="draft">Draft</option><option value="sent">Sent</option><option value="overdue">Overdue</option><option value="paid">Paid</option>
        </select>
        <button className="btn ghost" onClick={() => printInvoice(preview)}><Printer size={15}/> Print</button>
        <button className="btn primary" onClick={() => void downloadPdf(preview)}><Download size={15}/> Download PDF</button>
      </div>}>
      <div className="invoice-print"><InvoicePreview invoice={preview} brandName={dealById.get(preview.brand_deal_id ?? '')?.brand_name ?? null} /></div>
      {showPdf && <p className="hint" style={{ textAlign: 'center', marginTop: 10, fontSize: 11 }}>Preparing PDF… if your browser pops a download, you are all set.</p>}
    </Modal>}
  </>;
}

export function InvoicePreview({ invoice, brandName }: { invoice: Invoice; brandName?: string | null }): ReactElement {
  return <div className="invoice-preview">
    <div className="invoice-head">
      <div><div className="invoice-brand">SriCalendar</div><div className="muted" style={{ fontSize: 11 }}>Creator invoice</div></div>
      <div className="invoice-no">INVOICE {invoice.invoice_number}<br/>Issued: {invoice.issue_date}<br/>Due: {invoice.due_date}</div>
    </div>
    <div className="invoice-hero">
      <div><span>Bill to</span><strong>{invoice.recipient_name || brandName || 'Client'}</strong>{invoice.recipient_email ? <div className="muted" style={{ fontSize: 11 }}>{invoice.recipient_email}</div> : null}</div>
      <div><span>Amount due</span><strong>{formatMoney(invoice.total ?? 0, invoice.currency)}</strong></div>
    </div>
    <table className="invoice-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{(invoice.line_items ?? []).map((item) => <tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{formatMoney(item.rate, invoice.currency)}</td><td>{formatMoney((item.quantity ?? 0) * (item.rate ?? 0), invoice.currency)}</td></tr>)}</tbody></table>
    <div className="invoice-totals">
      <div className="row"><span>Subtotal</span><span>{formatMoney(invoice.subtotal ?? 0, invoice.currency)}</span></div>
      <div className="row"><span>Tax</span><span>{formatMoney(invoice.tax ?? 0, invoice.currency)}</span></div>
      <div className="grand"><span>Total</span><span>{formatMoney(invoice.total ?? 0, invoice.currency)}</span></div>
    </div>
    {invoice.client_note ? <p className="hint" style={{ marginTop: 20, fontSize: 11, color: 'var(--muted)' }}>Note: {invoice.client_note}</p> : null}
  </div>;
}