export type VoiceState = 'idle' | 'recording' | 'done'

export interface VoiceButtonProps {
  state:       VoiceState
  onToggle:    () => void
  /** Elapsed seconds — shown as formatted timer during recording / done */
  duration?:   number
  fullWidth?:  boolean
  disabled?:   boolean
  className?:  string
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Inline SVG icons ─────────────────────────────────────────────────────

function MicIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
      style={{ strokeDasharray: 24, strokeDashoffset: 0 }}
      className="animate-tick"
      aria-hidden="true">
      <polyline points="5 12 10 17 19 7" />
    </svg>
  )
}

// ── Waveform bars (5 CSS-animated bars) ─────────────────────────────────

const BAR_HEIGHTS = [0.55, 0.85, 0.45, 0.95, 0.65]

function WaveformBars() {
  return (
    <span aria-hidden="true" className="inline-flex gap-[3px] items-center h-9">
      {BAR_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-pill bg-white animate-pulse-dot"
          style={{
            height: `${h * 100}%`,
            animationDuration: `${0.9 + i * 0.12}s`,
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
    </span>
  )
}

// ── Component ────────────────────────────────────────────────────────────

export function VoiceButton({
  state,
  onToggle,
  duration = 0,
  fullWidth = true,
  disabled = false,
  className,
}: VoiceButtonProps) {
  const isRec  = state === 'recording'
  const isDone = state === 'done'

  const ariaLabels: Record<VoiceState, string> = {
    idle:      "Démarrer l'enregistrement vocal",
    recording: "Arrêter l'enregistrement",
    done:      "Enregistrement terminé",
  }

  const label    = isRec ? 'Enregistrement…' : isDone ? 'Note vocale enregistrée' : 'Tenir pour dicter'
  const sublabel = isRec
    ? formatDuration(duration)
    : isDone
    ? `${formatDuration(duration)} · Tap pour réécouter`
    : '0:00 — 0:30 max'

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={ariaLabels[state]}
      aria-pressed={isRec}
      className={[
        'flex items-center gap-4',
        'h-[84px] px-[22px]',
        'font-ui rounded-xl border-[1.5px]',
        'transition-all duration-[var(--t-fast,100ms)]',
        'active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        fullWidth ? 'w-full' : '',
        isRec  ? 'bg-status-alert border-status-alert text-white shadow-glow-alert shadow-2' :
        isDone ? 'bg-status-ok/10 border-status-ok text-status-ok shadow-1' :
                 'bg-surface border-line-strong text-ink shadow-1',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Icon circle */}
      <span
        className={[
          'relative w-14 h-14 rounded-full shrink-0',
          'inline-flex items-center justify-center',
          isRec  ? 'bg-white/18' :
          isDone ? 'bg-status-ok' :
                   'bg-ink',
          isRec  ? 'text-white' :
          isDone ? 'text-white' :
                   'text-bg',
        ].join(' ')}
      >
        {/* Pulse ring overlay — only during recording */}
        {isRec && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-white animate-pulse-ring"
          />
        )}
        {isRec && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-white animate-pulse-ring"
            style={{ animationDelay: '0.5s' }}
          />
        )}
        <span className="relative z-10">
          {isRec ? <StopIcon /> : isDone ? <CheckIcon /> : <MicIcon />}
        </span>
      </span>

      {/* Text */}
      <span className="flex-1 text-left">
        <div className="text-base font-semibold tracking-[-0.005em]">{label}</div>
        <div className="font-mono text-xs opacity-[0.78] mt-0.5">{sublabel}</div>
      </span>

      {/* Waveform (only during recording) */}
      {isRec && <WaveformBars />}
    </button>
  )
}
