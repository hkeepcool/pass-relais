import { useEffect } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { flushQueue } from '../sync/flush'
import { pullFromSupabase } from '../sync/pull'

export function useSyncQueue(): void {
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (isOnline) {
      flushQueue()
        .then(() => pullFromSupabase())
        .catch(console.error)
    }
  }, [isOnline])
}
