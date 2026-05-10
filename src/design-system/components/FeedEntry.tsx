import { useState } from 'react'
import { Badge, type StatusTone } from './Badge'

export interface FeedMetric {
  label: string
  value: string
}

export interface FeedEntryProps {
  timestamp:      string        // ISO or pre-formatted time string ("14:32")
  authorName:     string        // "Camille Boucher"
  authorInitials: string        // "CB" — pre-computed for performance
  text:           string
  status?:        StatusTone
  tag?:           { label: string; status: StatusTone }
  metrics?:       FeedMetric[]
  defaultExpanded?: boolean
  isLast?:        boolean       // suppresses timeline rail fade
  className?:     string
}

const toneTimeClasses: Record<StatusTone, string> = {
  ok:    'text-status-ok',
  warn:  'text-status-warn',
  alert: 'text-status-alert',
  info:  'text-ink-faint',
}

const toneBorderClasses: Record<StatusTone, string> = {
  ok:    'border-l-status-ok',
  warn:  'border-l-status-warn',
  alert: 'border-l-status-alert',
  info:  'border-l-line-soft',
}

function deriveInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function FeedEntry({
  timestamp,
  authorName,
  authorInitials,
  text,
  status,
  tag,
  metrics,
  defaultExpanded = false,
  isLast = false,
  className,
}: FeedEntryProps) {
  const [open, setOpen] = useState(defaultExpanded)
  const tone: StatusTone = status ?? 'info'
  const initials = authorInitials || deriveInitials(authorName)
  const expandable = text.length > 120 || (metrics && metrics.length > 0)

  return (
    <div className={['flex gap-3.5 pb-[18px] relative animate-fade-in', className].filter(Boolean).join(' ')}>
      {/* Timeline column */}
      <div className="w-11 shrink-0 relative">
        {/* Time */}
        <div className={['font-mono text-[11px] font-semibold text-right pr-1.5 pt-1', toneTimeClasses[tone]].join(' ')}>
          {timestamp}
        </div>
        {/* Vertical rail */}
        {!isLast && (
          <div
            aria-hidden="true"
            className="absolute right-[-1px] top-1.5 bottom-[-18px] w-[2px] bg-gradient-to-b from-line to-transparent"
          />
        )}
        {/* Dot */}
        <span
          aria-hidden="true"
          className={[
            'absolute right-[-5px] top-1.5 w-2.5 h-2.5 rounded-full',
            'ring-[3px] ring-bg',
            tone === 'ok'    ? 'bg-status-ok' :
            tone === 'warn'  ? 'bg-status-warn' :
            tone === 'alert' ? 'bg-status-alert' :
            'bg-ink-faint',
          ].join(' ')}
        />
      </div>

      {/* Entry content */}
      <div className="flex-1 min-w-0">
        {/* Header row: avatar + author name + optional tag */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            role="img"
            aria-label={authorName}
            className="w-6 h-6 rounded-full bg-surface-2 border border-line-strong text-ink-2 font-display text-[10px] font-medium flex items-center justify-center shrink-0"
          >
            {initials}
          </span>
          <span className="text-[13px] font-medium text-ink-2">{authorName}</span>
          {tag && (
            <Badge status={tag.status} label={tag.label} size="sm" />
          )}
        </div>

        {/* Card */}
        <button
          type="button"
          onClick={() => expandable && setOpen((o) => !o)}
          aria-expanded={expandable ? open : undefined}
          className={[
            'w-full text-left bg-surface border border-l-[3px]',
            toneBorderClasses[tone],
            tone === 'alert' ? 'border-r-status-alert/30 border-t-status-alert/30 border-b-status-alert/30' : 'border-r-line-soft border-t-line-soft border-b-line-soft',
            'rounded-md px-3.5 py-3',
            expandable ? 'cursor-pointer hover:bg-surface-2' : 'cursor-default',
            'transition-colors duration-[var(--t-fast,100ms)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
          ].filter(Boolean).join(' ')}
        >
          <p
            className={[
              'text-[15px] leading-[1.45] text-ink',
              !open ? 'line-clamp-2' : '',
            ].join(' ')}
          >
            {text}
          </p>

          {/* Metrics (visible when expanded) */}
          {metrics && metrics.length > 0 && open && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-2 mt-2.5 pt-2.5 border-t border-dashed border-line">
              {metrics.map((m, i) => (
                <div key={i}>
                  <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-mute">
                    {m.label}
                  </div>
                  <div className="font-mono text-sm font-semibold text-ink mt-0.5">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
