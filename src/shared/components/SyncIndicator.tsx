import { useAppStore } from '../../lib/store'

export function SyncIndicator() {
  const isOnline = useAppStore((s) => s.isOnline)
  const queueLength = useAppStore((s) => s.syncQueue.length)
  const hasConflicts = useAppStore((s) => s.conflicts.length > 0)

  // Dot color and label are independent — orange dot + "En ligne" is valid (online but flushing queue)
  const dotClass = hasConflicts
    ? 'bg-status-alert'
    : !isOnline || queueLength > 0
      ? 'bg-status-warn'
      : 'bg-status-ok'

  const label = hasConflicts ? 'Conflit' : !isOnline ? 'Offline' : 'En ligne'

  const labelClass = hasConflicts
    ? 'text-status-alert'
    : !isOnline
      ? 'text-status-warn'
      : 'text-ink-mute'

  return (
    <div className="flex items-center gap-1.5">
      <span role="status" className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotClass}`} />
      <span className={`text-xs font-mono ${labelClass}`}>{label}</span>
      {!isOnline && queueLength > 0 && (
        <span className="text-xs font-mono font-bold text-status-warn bg-status-warn/10 border border-status-warn/30 rounded px-1">
          {queueLength}
        </span>
      )}
    </div>
  )
}
