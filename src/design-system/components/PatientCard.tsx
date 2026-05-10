import { Badge, type StatusTone } from './Badge'

export interface PatientCardProps {
  status:       StatusTone
  name:         string
  room?:        string
  lastSeen:     string
  lastNote?:    string
  alertNote?:   string
  onClick:      () => void
  onInfoClick?: () => void
  className?:   string
}

const statusRailClasses: Record<StatusTone, string> = {
  ok:    'bg-status-ok opacity-40',
  warn:  'bg-status-warn',
  alert: 'bg-status-alert',
  info:  'bg-ink-faint',
}

function ChevronIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function PatientCard({
  status,
  name,
  room,
  lastSeen,
  lastNote,
  alertNote,
  onClick,
  onInfoClick,
  className,
}: PatientCardProps) {
  const displayNote = alertNote || lastNote

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={onClick}
        aria-label={[
          name,
          room ? `chambre ${room}` : null,
          status === 'alert' ? 'urgent' : status === 'warn' ? 'vigilance' : 'stable',
          `dernière observation ${lastSeen}`,
        ].filter(Boolean).join(', ')}
        className={[
          'relative w-full text-left overflow-hidden',
          'flex items-center gap-3.5',
          'min-h-[var(--row-h,76px)] px-[18px] py-[18px]',
          onInfoClick ? 'pr-12' : '',
          'bg-surface border border-line-soft rounded-lg shadow-1',
          'transition-all duration-[var(--t-fast,100ms)]',
          'active:scale-[0.99] hover:bg-surface-2',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          className,
        ].filter(Boolean).join(' ')}
      >
        {/* Status accent rail */}
        <span
          aria-hidden="true"
          className={[
            'absolute left-0 top-2 bottom-2 w-[3px] rounded-pill',
            statusRailClasses[status],
          ].join(' ')}
        />

        <Badge status={status} dot size={status === 'alert' ? 'lg' : 'md'} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-[20px] font-medium tracking-[-0.01em] truncate text-ink">
              {name}
            </span>
            <span className="font-mono text-[11px] font-medium text-ink-mute shrink-0">
              {lastSeen}
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-[3px] text-[13px] text-ink-2">
            {room && (
              <>
                <span className="font-mono text-xs text-ink-mute">Ch. {room}</span>
                <span className="w-[3px] h-[3px] rounded-full bg-ink-faint" aria-hidden="true" />
              </>
            )}
            {displayNote && (
              <span className={['truncate', alertNote ? 'text-status-alert font-semibold' : 'text-ink-2'].join(' ')}>
                {displayNote}
              </span>
            )}
          </div>
        </div>

        {!onInfoClick && (
          <span className="text-ink-faint shrink-0">
            <ChevronIcon />
          </span>
        )}
      </button>

      {onInfoClick && (
        <button
          type="button"
          onClick={onInfoClick}
          aria-label={`Voir le dossier de ${name}`}
          className="absolute right-3 inset-y-0 flex items-center px-1.5 text-ink-mute hover:text-ink transition-colors"
        >
          <InfoIcon />
        </button>
      )}
    </div>
  )
}
