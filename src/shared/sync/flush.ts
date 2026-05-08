import { supabase } from '../../lib/supabase'
import { queryClient } from '../../lib/queryClient'
import { useAppStore } from '../../lib/store'
import { getAllQueuedItems, removeQueuedItem, incrementQueuedItemRetries } from '../db/sync-queue.db'
import { getPatient } from '../db/patients.db'

const MAX_RETRIES = 5

export async function flushQueue(): Promise<void> {
  const items = await getAllQueuedItems()
  if (items.length === 0) return

  for (const item of items) {
    if (item.id === undefined) continue
    if (item.retries >= MAX_RETRIES) {
      await removeQueuedItem(item.id)
      continue
    }

    const localUpdatedAt = item.payload.updated_at as string | undefined
    const { data, error } = await supabase
      .from(item.table)
      .upsert(item.payload)

    if (error) {
      await incrementQueuedItemRetries(item.id)
      continue
    }

    const serverUpdatedAt = (data as Array<{ updated_at: string }>)[0]?.updated_at
    if (localUpdatedAt && serverUpdatedAt && serverUpdatedAt > localUpdatedAt) {
      const patientId = item.payload.patient_id as string | undefined
      const patientName = patientId
        ? (await getPatient(patientId))?.full_name ?? 'Patient inconnu'
        : 'Patient inconnu'

      useAppStore.getState().addConflict({
        patientName,
        table: item.table,
        id: item.payload.id as string,
      })
    }

    await removeQueuedItem(item.id)
    await queryClient.invalidateQueries({ queryKey: [item.table] })
  }
}
