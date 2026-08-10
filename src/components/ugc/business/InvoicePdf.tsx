import type { ReactElement } from 'react';
import { Document, Page, StyleSheet, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { formatMoney } from '../../../utils/money';
import type { Invoice, InvoiceLineItem } from '../../../types/ugc';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: '#3f3750', fontFamily: 'Helvetica' },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  brand: { fontSize: 22, fontWeight: 'bold', color: '#f54f86' },
  meta: { fontSize: 10, color: '#7a7289' },
  metaLine: { marginBottom: 2 },
  hero: { flexDirection: 'row', justifyContent: 'space-between', borderTop: 1, borderBottom: 1, borderColor: '#d8c8fa', paddingVertical: 14, marginBottom: 18 },
  heroCol: { flexDirection: 'column' },
  heroLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, color: '#7a7289', marginBottom: 3 },
  heroValue: { fontSize: 11, fontWeight: 'bold', color: '#4a3858' },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#eee6ff', paddingVertical: 7 },
  rowHeader: { flexDirection: 'row', borderBottom: 1, borderColor: '#d8c8fa', paddingVertical: 6 },
  colDesc: { flex: 3, marginRight: 8 },
  colNum: { flex: 1, textAlign: 'right' },
  headerText: { fontSize: 8, textTransform: 'uppercase', color: '#7a7289', letterSpacing: 1 },
  totals: { alignSelf: 'flex-end', width: '45%', marginTop: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, color: '#6a5a82' },
  grand: { flexDirection: 'row', justifyContent: 'space-between', borderTop: 2, borderColor: '#d8c8fa', paddingTop: 8, marginTop: 4, fontSize: 14, fontWeight: 'bold', color: '#7047a4' },
  note: { marginTop: 24, fontSize: 9, color: '#7a7289' },
});

/** Server-quality PDF document exported via @react-pdf/renderer. */
export function InvoicePdf({ invoice, brandName }: { invoice: Invoice; brandName?: string | null }): ReactElement<DocumentProps> {
  const cur = invoice.currency || 'USD';
  return <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.head}>
        <View>
          <Text style={styles.brand}>SriCalendar</Text>
          <Text style={styles.meta}>Creator invoice</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaLine}>Number: {invoice.invoice_number}</Text>
          <Text style={styles.metaLine}>Issued: {invoice.issue_date}</Text>
          <Text style={styles.metaLine}>Due: {invoice.due_date}</Text>
          <Text style={styles.metaLine}>Status: {invoice.status}</Text>
        </View>
      </View>
      <View style={styles.hero}>
        <View style={styles.heroCol}>
          <Text style={styles.heroLabel}>Bill to</Text>
          <Text style={styles.heroValue}>{invoice.recipient_name || brandName || 'Client'}</Text>
          {invoice.recipient_email ? <Text style={styles.meta}>{invoice.recipient_email}</Text> : null}
        </View>
        <View style={styles.heroCol}>
          <Text style={styles.heroLabel}>Amount due</Text>
          <Text style={styles.heroValue}>{formatMoney(invoice.total ?? 0, cur)}</Text>
        </View>
      </View>
      <View style={styles.rowHeader}>
        <Text style={[styles.colDesc, styles.headerText]}>Description</Text>
        <Text style={[styles.colNum, styles.headerText]}>Qty</Text>
        <Text style={[styles.colNum, styles.headerText]}>Rate</Text>
        <Text style={[styles.colNum, styles.headerText]}>Amount</Text>
      </View>
      {invoice.line_items.map((item) => <InvoiceLine key={item.id} item={item} currency={cur} />)}
      <View style={styles.totals}>
        <View style={styles.totalRow}><Text>Subtotal</Text><Text>{formatMoney(invoice.subtotal ?? 0, cur)}</Text></View>
        <View style={styles.totalRow}><Text>Tax</Text><Text>{formatMoney(invoice.tax ?? 0, cur)}</Text></View>
        <View style={styles.grand}><Text>Total</Text><Text>{formatMoney(invoice.total ?? 0, cur)}</Text></View>
      </View>
      {invoice.client_note ? <Text style={styles.note}>Note: {invoice.client_note}</Text> : <Text style={styles.note}>Thank you for supporting the work!</Text>}
    </Page>
  </Document>;
}

type ReactElementDoc = import('react').ReactElement;

function InvoiceLine({ item, currency }: { item: InvoiceLineItem; currency: string }): ReactElementDoc {
  return <View style={styles.row}>
    <Text style={styles.colDesc}>{item.description}</Text>
    <Text style={styles.colNum}>{item.quantity}</Text>
    <Text style={styles.colNum}>{formatMoney(item.rate, currency)}</Text>
    <Text style={styles.colNum}>{formatMoney(item.quantity * item.rate, currency)}</Text>
  </View>;
}