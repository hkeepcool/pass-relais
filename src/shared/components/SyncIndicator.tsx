import { useAppStore } from '../../lib/store'

export function SyncIndicator() {
  const isOnline = useAppStore((s) => s.isOnline)
  const queueLength = useAppStore((s) => s.syncQueue.length)
  const hasConflicts = useAppStore((s) => s.conflicts.length > 0)

  const colorClass = hasConflicts
    ? 'bg-red-500'
    : !isOnline || queueLength > 0
      ? 'bg-orange-400'
      : 'bg-green-500'

  const label = hasConflicts
    ? 'Conflit'
    : !isOnline
      ? 'Offline'
      : 'En ligne'

  return (
    <div className="flex items-center gap-1.5">
      <span role="status" className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
      <span className="text-xs text-gray-600">{label}</span>
      {!isOnline && queueLength > 0 && (
        <span className="text-xs font-medium text-orange-600">{queueLength}</span>
      )}
    </div>
  )
}
