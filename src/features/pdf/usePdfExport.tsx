import { useState, useCallback } from 'react'
import { pdf } from '@react-pdf/renderer'
import { getObservationsByPatient } from '../../shared/db/observations.db'
import { getAllPatients, getPatient } from '../../shared/db/patients.db'
import { useAuth } from '../auth/useAuth'
import { sharePdf } from './sharePdf'
import { PatientReportDocument } from './PatientReportDocument'
import { TourReportDocument } from './TourReportDocument'
import { windowStart, formatWindowLabel, toSlug, todayISO } from './pdfUtils'
import type { ShiftWindow } from './pdfUtils'
import type { PatientSummary } from './TourReportDocument'

export type { ShiftWindow }

export function usePdfExport(type: 'patient' | 'tour', patientId?: string) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { session } = useAuth()
  const userId      = session?.user?.id
  const nurseName   = (session?.user.user_metadata?.full_name as string)
    ?? session?.user.email
    ?? 'Infirmier(ère)'

  const generate = useCallback(async (window: ShiftWindow) => {
    if (type === 'patient' && !patientId) throw new Error('patientId required for patient export')
    setIsGenerating(true)
    try {
      const since       = windowStart(window)
      const windowLabel = formatWindowLabel(window)
      const exportDate  = todayISO()

      if (type === 'patient' && patientId) {
        const [allObs, patient] = await Promise.all([
          getObservationsByPatient(patientId),
          getPatient(patientId),
        ])
        if (!patient) throw new Error(`Patient ${patientId} not found`)
        const observations = allObs.filter(o => new Date(o.recorded_at) >= since)
        const blob = await pdf(
          <PatientReportDocument
            patient={patient}
            observations={observations}
            nurseName={nurseName}
            windowLabel={windowLabel}
            exportDate={exportDate}
          />
        ).toBlob()
        await sharePdf(blob, `transmission-${toSlug(patient.full_name)}-${exportDate}.pdf`)
      } else {
        const patients = await getAllPatients()
        const summaries: PatientSummary[] = await Promise.all(
          patients.map(async (p) => {
            const allObs = await getObservationsByPatient(p.id)
            return {
              patient: p,
              observations: allObs.filter(o => new Date(o.recorded_at) >= since),
            }
          }),
        )
        const patientSummaries = summaries.filter(ps => ps.observations.length > 0)
        const blob = await pdf(
          <TourReportDocument
            patientSummaries={patientSummaries}
            nurseName={nurseName}
            windowLabel={windowLabel}
            exportDate={exportDate}
          />
        ).toBlob()
        await sharePdf(blob, `rapport-garde-${exportDate}.pdf`)
      }
    } finally {
      setIsGenerating(false)
    }
  }, [type, patientId, userId, nurseName])

  return { generate, isGenerating }
}
