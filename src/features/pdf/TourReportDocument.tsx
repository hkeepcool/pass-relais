import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Patient, Observation } from '../../shared/db/schema'
import { STATUS_LABELS } from '../../shared/utils/status'

export interface PatientSummary {
  patient:      Patient
  observations: Observation[]
}

export interface TourReportProps {
  patientSummaries: PatientSummary[]
  nurseName:        string
  windowLabel:      string
  exportDate:       string
}

const C = {
  brand:    '#0284c7',
  bg:       '#ffffff',
  surface:  '#f8fafc',
  border:   '#e2e8f0',
  ink:      '#0f172a',
  inkMute:  '#64748b',
  green:    '#dcfce7', greenFg:  '#166534',
  orange:   '#fef3c7', orangeFg: '#92400e',
  red:      '#fee2e2', redFg:    '#991b1b',
  redAlert: '#fef2f2',
  amber:    '#92400e',
}

const S = StyleSheet.create({
  page:         { backgroundColor: C.bg, color: C.ink, fontFamily: 'Helvetica', padding: 32, fontSize: 10 },
  header:       { borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: 'solid', paddingBottom: 8, marginBottom: 12 },
  title:        { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.brand, marginBottom: 2 },
  subtitle:     { fontSize: 9, color: C.inkMute },
  alertBox:     { backgroundColor: C.redAlert, borderRadius: 4, padding: 8, marginBottom: 10 },
  alertTitle:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.redFg, marginBottom: 4 },
  alertRow:     { fontSize: 9, color: '#b91c1c', marginBottom: 2 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.inkMute, marginBottom: 6, letterSpacing: 0.5 },
  cardRow:      { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 4, borderLeftWidth: 3, padding: 7, marginBottom: 5 },
  cardName:     { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.ink },
  cardMeta:     { fontSize: 8, color: C.inkMute, marginTop: 1 },
  badge:        { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:    { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  footer:       { position: 'absolute', bottom: 16, left: 32, right: 32, borderTopWidth: 1, borderTopColor: C.border, borderTopStyle: 'solid', paddingTop: 4 },
  footerText:   { fontSize: 8, color: C.inkMute },
})

const STATUS_BG:     Record<string, string> = { green: C.green,   orange: C.orange,   red: C.red   }
const STATUS_FG:     Record<string, string> = { green: C.greenFg, orange: C.orangeFg, red: C.redFg }
const STATUS_BORDER: Record<string, string> = { green: '#22c55e', orange: '#f59e0b',  red: '#ef4444' }
const SEVERITY:      Record<string, number> = { red: 0, orange: 1, green: 2 }
const SLEEP_FR:  Record<string, string> = { rested: 'Reposé',  agitated: 'Agité',   insomnia: 'Insomnie' }
const MOOD_FR:   Record<string, string> = { stable: 'Stable',  confused: 'Confus',  anxious: 'Anxieux'   }

function worstColor(obs: Observation[]): 'red' | 'orange' | 'green' {
  if (obs.some(o => o.status_color === 'red'))    return 'red'
  if (obs.some(o => o.status_color === 'orange')) return 'orange'
  return 'green'
}

function latest<K extends keyof Observation>(obs: Observation[], key: K): Observation[K] | null {
  return [...obs]
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .find(o => o[key] != null)?.[key] ?? null
}

export function TourReportDocument({
  patientSummaries, nurseName, windowLabel, exportDate,
}: TourReportProps) {
  const sorted = [...patientSummaries].sort(
    (a, b) => (SEVERITY[worstColor(a.observations)] ?? 2) - (SEVERITY[worstColor(b.observations)] ?? 2),
  )
  const alerts = sorted.filter(
    ps => worstColor(ps.observations) === 'red' || worstColor(ps.observations) === 'orange',
  )

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Pass-Relais — Rapport de garde</Text>
          <Text style={S.subtitle}>{nurseName} · {exportDate} · {windowLabel}</Text>
          <Text style={S.subtitle}>{sorted.length} patient{sorted.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Alert block — only if red/orange patients exist */}
        {alerts.length > 0 && (
          <View style={S.alertBox}>
            <Text style={S.alertTitle}>⚠ ALERTES ({alerts.length})</Text>
            {alerts.map(({ patient, observations }) => {
              const pain = latest(observations, 'pain')
              const note = [...observations]
                .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
                .find(o => o.note_text)?.note_text
              return (
                <Text key={patient.id} style={S.alertRow}>
                  {patient.full_name}
                  {pain != null ? ` — Douleur ${pain}/5` : ''}
                  {note ? ` — "${note.slice(0, 50)}"` : ''}
                </Text>
              )
            })}
          </View>
        )}

        {/* Patient cards */}
        <Text style={S.sectionLabel}>PATIENTS ({sorted.length})</Text>
        {sorted.map(({ patient, observations }) => {
          const color     = worstColor(observations)
          const pain      = latest(observations, 'pain')
          const sleep     = latest(observations, 'sleep')
          const mood      = latest(observations, 'mood')
          const metaParts: string[] = []
          if (sleep != null) metaParts.push(SLEEP_FR[sleep] ?? sleep)
          if (pain  != null) metaParts.push(`Douleur ${pain}/5`)
          if (mood  != null) metaParts.push(MOOD_FR[mood]  ?? mood)

          return (
            <View
              key={patient.id}
              style={[S.cardRow, { backgroundColor: C.surface, borderLeftColor: STATUS_BORDER[color] }]}
              wrap={false}
            >
              <View style={{ flex: 1 }}>
                <Text style={S.cardName}>{patient.full_name}</Text>
                {metaParts.length > 0 && (
                  <Text style={S.cardMeta}>{metaParts.join(' · ')}</Text>
                )}
              </View>
              {STATUS_LABELS[color] != null && (
                <View style={[S.badge, { backgroundColor: STATUS_BG[color] }]}>
                  <Text style={[S.badgeText, { color: STATUS_FG[color] }]}>
                    {STATUS_LABELS[color]}
                  </Text>
                </View>
              )}
            </View>
          )
        })}

        {/* Footer */}
        <Text
          style={[S.footer, S.footerText]}
          fixed
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Généré le ${exportDate} par Pass-Relais · ${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  )
}
