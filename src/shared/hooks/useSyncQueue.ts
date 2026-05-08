import { useEffect } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { flushQueue } from '../sync/flush'

export function useSyncQueue(): void {
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (isOnline) {
      flushQueue().catch(console.error)
    }
  }, [isOnline])
}
