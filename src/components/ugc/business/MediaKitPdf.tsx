import type { ReactElement } from 'react';
import { Document, Page, StyleSheet, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { formatMoney } from '../../../utils/money';
import type { MediaKitProfile } from '../../../types/ugc';

const styles = StyleSheet.create({
  page: { padding: 34, fontSize: 10, color: '#3f3750', fontFamily: 'Helvetica' },
  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f54f86', color: '#ffffff', fontSize: 22, textAlign: 'center', lineHeight: 46, marginRight: 12 },
  heroText: { flexDirection: 'column', flex: 1 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#4a3858' },
  tagline: { fontSize: 10, color: '#7a7289', marginTop: 2 },
  stats: { flexDirection: 'row', borderTop: 1, borderBottom: 1, borderColor: '#d8c8fa', paddingVertical: 10, marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: 'bold', color: '#7047a4' },
  statLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, color: '#7a7289', marginTop: 2 },
  sectionTitle: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.2, color: '#f54f86', marginTop: 12, marginBottom: 5 },
  body: { fontSize: 10, color: '#4a3858', lineHeight: 1.55 },
  kv: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 },
  kvItem: { width: '50%', marginBottom: 3 },
  kvLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, color: '#7a7289' },
  kvValue: { fontSize: 10, fontWeight: 'bold', color: '#4a3858' },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: 1, borderColor: '#eee6ff', paddingVertical: 5 },
  footer: { position: 'absolute', bottom: 28, left: 34, right: 34, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#7a7289', borderTop: 1, borderColor: '#eee6ff', paddingTop: 6 },
});

/** One-page portfolio PDF a creator can attach to any pitch — mirrors the media-kit preview. */
export function MediaKitPdf({ profile, stats }: { profile: MediaKitProfile; stats: { followers: number; engagement: number; avgReach: number } }): ReactElement<DocumentProps> {
  const cur = profile.currency || 'USD';
  const er = stats.engagement.toFixed(2);
  const followers = stats.followers ? formatCompact(stats.followers) : '·';
  const reach = stats.avgReach ? formatCompact(stats.avgReach) : '·';
  return <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.avatar}><Text>{profile.display_name?.trim()?.[0]?.toUpperCase() ?? 'C'}</Text></View>
        <View style={styles.heroText}>
          <Text style={styles.name}>{profile.display_name || 'Your Name'}</Text>
          <Text style={styles.tagline}>{profile.tagline}</Text>
        </View>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statValue}>{followers}</Text><Text style={styles.statLabel}>Followers</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{er}%</Text><Text style={styles.statLabel}>Engagement</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{reach}</Text><Text style={styles.statLabel}>Avg reach</Text></View>
      </View>
      {profile.bio ? <Text style={styles.body}>{profile.bio}</Text> : null}
      <Text style={styles.sectionTitle}>Profile</Text>
      <View style={styles.kv}>
        {profile.niche ? <View style={styles.kvItem}><Text style={styles.kvLabel}>Niche</Text><Text style={styles.kvValue}>{profile.niche}</Text></View> : null}
        {profile.location ? <View style={styles.kvItem}><Text style={styles.kvLabel}>Location</Text><Text style={styles.kvValue}>{profile.location}</Text></View> : null}
        {profile.form_factor ? <View style={styles.kvItem}><Text style={styles.kvLabel}>Form factor</Text><Text style={styles.kvValue}>{profile.form_factor}</Text></View> : null}
        {profile.availability ? <View style={styles.kvItem}><Text style={styles.kvLabel}>Availability</Text><Text style={styles.kvValue}>{profile.availability}</Text></View> : null}
        {profile.email ? <View style={styles.kvItem}><Text style={styles.kvLabel}>Email</Text><Text style={styles.kvValue}>{profile.email}</Text></View> : null}
      </View>
      {(profile.rates ?? []).filter((r) => r.name).length > 0 ? <>
        <Text style={styles.sectionTitle}>Rates</Text>
        {(profile.rates ?? []).filter((r) => r.name).map((r) => <View key={r.id} style={styles.row}>
          <Text style={styles.body}>{r.name}{r.includes ? ` — ${r.includes}` : ''}</Text>
          <Text style={styles.body}><Text style={{ fontWeight: 'bold' }}>{formatMoney(r.price, cur)}</Text>{r.negotiable ? ' (nego)' : ''}</Text>
        </View>)}
      </> : null}
      {(profile.past_collabs ?? []).filter((c) => c.brand).length > 0 ? <>
        <Text style={styles.sectionTitle}>Past collaborations</Text>
        <View style={styles.kv}>{(profile.past_collabs ?? []).filter((c) => c.brand).map((c) => <View key={c.id} style={styles.kvItem}><Text style={styles.kvValue}>{c.brand}</Text><Text style={styles.kvLabel}>{c.format} · {c.year}</Text></View>)}</View>
      </> : null}
      {(profile.audience_demographics.age || profile.audience_demographics.gender || profile.audience_demographics.geo) ? <>
        <Text style={styles.sectionTitle}>Audience</Text>
        <Text style={styles.body}>{Object.entries(profile.audience_demographics).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}</Text>
      </> : null}
      <View style={styles.footer}>
        <Text>SriCalendar · media kit</Text>
        <Text>{profile.availability || 'open to brand work'}</Text>
      </View>
    </Page>
  </Document>;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
