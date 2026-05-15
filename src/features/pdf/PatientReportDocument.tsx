import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Patient, Observation } from '../../shared/db/schema'
import { summarizeObservations } from '../../shared/utils/summarize'

export interface PatientReportProps {
  patient:      Patient
  observations: Observation[]
  nurseName:    string
  windowLabel:  string
  exportDate:   string
}

const C = {
  brand:    '#0284c7',
  bg:       '#ffffff',
  surface:  '#f8fafc',
  border:   '#e2e8f0',
  ink:      '#0f172a',
  inkMute:  '#64748b',
  inkSub:   '#475569',
  green:    '#dcfce7', greenFg:  '#166534',
  orange:   '#fef3c7', orangeFg: '#92400e',
  red:      '#fee2e2', redFg:    '#991b1b',
  amber:    '#92400e',
}

const S = StyleSheet.create({
  page:         { backgroundColor: C.bg, color: C.ink, fontFamily: 'Helvetica', padding: 32, fontSize: 10 },
  header:       { borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: 'solid', paddingBottom: 8, marginBottom: 12 },
  title:        { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.brand, marginBottom: 2 },
  subtitle:     { fontSize: 9, color: C.inkMute, marginBottom: 1 },
  badgeStrip:   { flexDirection: 'row', marginBottom: 10, flexWrap: 'wrap' },
  chip:         { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 5, marginBottom: 4 },
  chipMuted:    { backgroundColor: C.surface },
  chipMutedFg:  { fontSize: 9, color: C.inkMute },
  summaryBox:   { backgroundColor: C.surface, borderLeftWidth: 3, borderLeftColor: C.brand, borderLeftStyle: 'solid', padding: 8, marginBottom: 12, borderRadius: 2 },
  summaryLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.brand, marginBottom: 3 },
  summaryText:  { fontSize: 9, color: C.inkSub, lineHeight: 1.5 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.inkMute, marginBottom: 4, letterSpacing: 0.5 },
  tableHeader:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: 'solid', paddingBottom: 3, marginBottom: 3 },
  tableRow:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.surface, borderBottomStyle: 'solid', paddingVertical: 3 },
  headerCell:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.inkMute },
  cell:         { fontSize: 8, color: C.ink },
  cellMute:     { fontSize: 8, color: C.inkMute },
  cellAmber:    { fontSize: 8, color: C.amber },
  colTime:      { width: 40 },
  colSm:        { width: 36 },
  colMd:        { width: 60 },
  colNote:      { flex: 1 },
  footer:       { position: 'absolute', bottom: 16, left: 32, right: 32, borderTopWidth: 1, borderTopColor: C.border, borderTopStyle: 'solid', paddingTop: 4 },
  footerText:   { fontSize: 8, color: C.inkMute },
})

const STATUS_BG:    Record<string, string> = { green: C.green,   orange: C.orange,   red: C.red   }
const STATUS_FG:    Record<string, string> = { green: C.greenFg, orange: C.orangeFg, red: C.redFg }
const STATUS_LABEL: Record<string, string> = { green: 'VERT',    orange: 'ORANGE',   red: 'ROUGE' }
const SLEEP_FR:  Record<string, string> = { rested: 'Reposé',  agitated: 'Agité',   insomnia: 'Insomnie' }
const APP_FR:    Record<string, string> = { normal: 'Normal',  low: 'Faible',       refused: 'Refus'     }
const MOOD_FR:   Record<string, string> = { stable: 'Stable',  confused: 'Confus',  anxious: 'Anxieux'   }

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function truncate(s: string, n = 60): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

export function PatientReportDocument({
  patient, observations, nurseName, windowLabel, exportDate,
}: PatientReportProps) {
  const sorted      = [...observations].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
  const latest      = sorted[0]
  const statusColor = latest?.status_color ?? 'green'
  const lastPain    = sorted.find(o => o.pain     != null)?.pain
  const lastSleep   = sorted.find(o => o.sleep    != null)?.sleep
  const lastApp     = sorted.find(o => o.appetite != null)?.appetite
  const summary     = summarizeObservations(observations)

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Pass-Relais</Text>
          <Text style={S.subtitle}>Transmission — {patient.full_name}</Text>
          <Text style={S.subtitle}>{nurseName} · {exportDate} · {windowLabel}</Text>
          {patient.birth_date && (
            <Text style={S.subtitle}>Né(e) le {patient.birth_date} · {patient.care_level}</Text>
          )}
        </View>

        {/* Badge strip */}
        <View style={S.badgeStrip}>
          <View style={[S.chip, { backgroundColor: STATUS_BG[statusColor] }]}>
            <Text style={{ fontSize: 9, color: STATUS_FG[statusColor] }}>
              {STATUS_LABEL[statusColor]}
            </Text>
          </View>
          {lastPain != null && (
            <View style={[S.chip, S.chipMuted]}>
              <Text style={S.chipMutedFg}>Douleur {lastPain}/5</Text>
            </View>
          )}
          {lastSleep != null && (
            <View style={[S.chip, S.chipMuted]}>
              <Text style={S.chipMutedFg}>{SLEEP_FR[lastSleep]}</Text>
            </View>
          )}
          {lastApp != null && (
            <View style={[S.chip, S.chipMuted]}>
              <Text style={S.chipMutedFg}>{APP_FR[lastApp]}</Text>
            </View>
          )}
        </View>

        {/* AI summary — omitted if no observations */}
        {observations.length > 0 && (
          <View style={S.summaryBox}>
            <Text style={S.summaryLabel}>RÉSUMÉ</Text>
            <Text style={S.summaryText}>{summary.text}</Text>
          </View>
        )}

        {/* Observation table */}
        <Text style={S.sectionLabel}>OBSERVATIONS ({sorted.length})</Text>
        <View style={S.tableHeader}>
          <Text style={[S.colTime, S.headerCell]}>Heure</Text>
          <Text style={[S.colMd,   S.headerCell]}>Sommeil</Text>
          <Text style={[S.colMd,   S.headerCell]}>Appétit</Text>
          <Text style={[S.colSm,   S.headerCell]}>Douleur</Text>
          <Text style={[S.colMd,   S.headerCell]}>Humeur</Text>
          <Text style={[S.colSm,   S.headerCell]}>Selles</Text>
          <Text style={[S.colNote, S.headerCell]}>Note</Text>
        </View>
        {sorted.map((obs) => (
          <View key={obs.id} style={S.tableRow} wrap={false}>
            <Text style={[S.colTime, S.cellMute]}>{fmtTime(obs.recorded_at)}</Text>
            <Text style={[S.colMd,   S.cell]}>{obs.sleep    ? SLEEP_FR[obs.sleep]    : '—'}</Text>
            <Text style={[S.colMd,   S.cell]}>{obs.appetite ? APP_FR[obs.appetite]   : '—'}</Text>
            <Text style={[S.colSm,   S.cell]}>{obs.pain     != null ? `${obs.pain}/5` : '—'}</Text>
            <Text style={[S.colMd,   S.cell]}>{obs.mood     ? MOOD_FR[obs.mood]      : '—'}</Text>
            <Text style={[S.colSm,   S.cell]}>
              {obs.bowel_movements != null
                ? (obs.bowel_movements === 3 ? '3+' : String(obs.bowel_movements))
                : '—'}
            </Text>
            <Text style={[S.colNote, obs.note_text ? S.cellAmber : S.cellMute]}>
              {obs.note_text ? truncate(obs.note_text) : '—'}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <Text
          style={[S.footer, S.footerText]}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Généré le ${exportDate} par Pass-Relais · ${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  )
}
