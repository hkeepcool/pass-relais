import type { ReactNode } from 'react'

export type TapTone = 'neutral' | 'ok' | 'warn' | 'alert'

export interface QuickTapButtonProps {
  label:     string
  sublabel?: string   // secondary label, e.g. pain scale description "Légère"
  glyph?:    ReactNode   // large decorative character/emoji/icon component
  selected?: boolean
  onSelect?: () => void
  tone?:     TapTone
  disabled?: boolean
  className?: string
}

const toneRingClasses: Record<TapTone, string> = {
  neutral: 'border-ink      text-ink      shadow-glow-accent',
  ok:      'border-status-ok   text-status-ok   shadow-glow-ok',
  warn:    'border-status-warn text-status-warn shadow-glow-warn',
  alert:   'border-status-alert text-status-alert shadow-glow-alert',
}

const checkBgClasses: Record<TapTone, string> = {
  neutral: 'bg-accent',
  ok:      'bg-status-ok',
  warn:    'bg-status-warn',
  alert:   'bg-status-alert',
}

function CheckIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="5 12 10 17 19 7" />
    </svg>
  )
}

export function QuickTapButton({
  label,
  sublabel,
  glyph,
  selected = false,
  onSelect,
  tone = 'neutral',
  disabled = false,
  className,
}: QuickTapButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label + (sublabel ? `, ${sublabel}` : '')}
      onClick={onSelect}
      disabled={disabled}
      className={[
        'relative flex flex-col items-center justify-center gap-1.5 flex-1',
        'min-h-[86px] px-3 py-3.5',
        'font-ui rounded-lg',
        'transition-all duration-[var(--t-fast,100ms)]',
        'active:scale-[0.975]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        selected
          ? ['bg-surface-2 border-[1.5px] shadow-1', toneRingClasses[tone]].join(' ')
          : 'bg-surface border border-line text-ink shadow-1 hover:bg-surface-2',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Check badge (top-right when selected) */}
      {selected && (
        <span
          aria-hidden="true"
          className={[
            'absolute top-2 right-2 w-[18px] h-[18px] rounded-full',
            'inline-flex items-center justify-center',
            checkBgClasses[tone],
          ].join(' ')}
        >
          <CheckIcon />
        </span>
      )}

      {/* Glyph */}
      {glyph && (
        <span
          aria-hidden="true"
          className={[
            'font-display text-2xl leading-none',
            selected ? '' : 'opacity-80 text-ink-2',
          ].filter(Boolean).join(' ')}
        >
          {glyph}
        </span>
      )}

      {/* Label */}
      <span className="text-[15px] font-semibold tracking-[-0.005em]">
        {label}
      </span>

      {/* Sublabel — always rendered to keep all buttons the same height */}
      <span className={['text-[11px] font-medium text-ink-mute', !sublabel && 'invisible'].filter(Boolean).join(' ')}>
        {sublabel ?? '\u00A0'}
      </span>
    </button>
  )
}
