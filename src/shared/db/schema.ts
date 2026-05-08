import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface Patient {
  id: string
  full_name: string
  birth_date: string | null
  care_level: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Observation {
  id: string
  patient_id: string
  caregiver_id: string
  recorded_at: string
  sleep: 'rested' | 'agitated' | 'insomnia' | null
  appetite: 'normal' | 'low' | 'refused' | null
  pain: 1 | 2 | 3 | 4 | 5 | null
  mood: 'stable' | 'confused' | 'anxious' | null
  note_text: string | null
  note_audio_url: string | null
  status_color: 'green' | 'orange' | 'red'
  updated_at: string
}

export interface SyncQueueRecord {
  id?: number
  operation: 'INSERT' | 'UPDATE'
  table: string
  payload: Record<string, unknown>
  created_at: number
  retries: number
}

export interface SessionCacheRecord {
  key: 'session'
  access_token: string
  refresh_token: string
  expires_at: number
}

interface PassRelaisDB extends DBSchema {
  patients: { key: string; value: Patient; indexes: { updated_at: string } }
  observations: {
    key: string
    value: Observation
    indexes: { patient_id: string; recorded_at: string }
  }
  sync_queue: {
    key: number
    value: SyncQueueRecord
    indexes: { created_at: number }
  }
  session_cache: { key: string; value: SessionCacheRecord }
}

let _db: Promise<IDBPDatabase<PassRelaisDB>> | null = null

export function getDb(): Promise<IDBPDatabase<PassRelaisDB>> {
  if (!_db) {
    _db = openDB<PassRelaisDB>('pass-relais', 1, {
      upgrade(db) {
        const patients = db.createObjectStore('patients', { keyPath: 'id' })
        patients.createIndex('updated_at', 'updated_at')

        const obs = db.createObjectStore('observations', { keyPath: 'id' })
        obs.createIndex('patient_id', 'patient_id')
        obs.createIndex('recorded_at', 'recorded_at')

        const queue = db.createObjectStore('sync_queue', {
          keyPath: 'id',
          autoIncrement: true,
        })
        queue.createIndex('created_at', 'created_at')

        db.createObjectStore('session_cache', { keyPath: 'key' })
      },
    })
  }
  return _db
}

export async function resetDbForTests(): Promise<void> {
  if (_db) {
    const db = await _db
    const tx = db.transaction(['patients', 'observations', 'sync_queue', 'session_cache'], 'readwrite')
    await tx.objectStore('patients').clear()
    await tx.objectStore('observations').clear()
    await tx.objectStore('sync_queue').clear()
    await tx.objectStore('session_cache').clear()
    await tx.done
  }
  _db = null
}
