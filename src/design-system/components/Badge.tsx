export type StatusTone = 'ok' | 'warn' | 'alert' | 'info'

export interface BadgeProps {
  status: StatusTone
  /** Text label — renders as pill when provided, dot-only when omitted */
  label?: string
  /** Force dot-only mode even when label is provided */
  dot?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const toneClasses: Record<StatusTone, { dot: string; text: string; bg: string }> = {
  ok:    { dot: 'bg-status-ok',   text: 'text-status-ok',   bg: 'bg-status-ok/15' },
  warn:  { dot: 'bg-status-warn', text: 'text-status-warn', bg: 'bg-status-warn/15' },
  alert: { dot: 'bg-status-alert',text: 'text-status-alert',bg: 'bg-status-alert/15' },
  info:  { dot: 'bg-ink-faint',   text: 'text-ink-mute',    bg: 'bg-surface-inset' },
}

const toneLabels: Record<StatusTone, string> = {
  ok:    'stable',
  warn:  'vigilance',
  alert: 'urgent',
  info:  'info',
}

const dotSizeClasses = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3.5 h-3.5' }

export function Badge({ status, label, dot = false, size = 'md', className }: BadgeProps) {
  const t = toneClasses[status] ?? toneClasses.info
  const ariaLabel = `Statut ${toneLabels[status] ?? status}`

  // Dot-only mode
  if (dot || !label) {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        className={[
          'relative inline-flex items-center justify-center',
          className,
        ].filter(Boolean).join(' ')}
      >
        {status === 'alert' && (
          <span
            aria-hidden="true"
            className={[
              'absolute inset-0 rounded-full opacity-30 animate-pulse-dot',
              t.dot,
            ].join(' ')}
          />
        )}
        <span className={['rounded-full', dotSizeClasses[size], t.dot].join(' ')} />
      </span>
    )
  }

  // Pill mode
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={[
        'inline-flex items-center gap-1.5 rounded-pill font-ui font-semibold uppercase tracking-wider',
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        t.text,
        t.bg,
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className={['rounded-full', 'w-1.5 h-1.5', t.dot].join(' ')} aria-hidden="true" />
      {label}
    </span>
  )
}
