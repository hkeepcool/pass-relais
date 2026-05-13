import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  Moon, Waves, EyeOff,
  Utensils, MinusCircle, XCircle,
  Check, HelpCircle, Activity,
  Smile, Meh, Frown,
} from 'lucide-react'
import { QuickTapButton, Button, VoiceButton } from '../../design-system'
import type { TapTone, VoiceState } from '../../design-system'
import { useTranscription } from '../../shared/hooks/useTranscription'
import { WebSpeechAdapter } from '../../shared/hooks/transcription/WebSpeechAdapter'
import { useSaveObservation } from './useSaveObservation'
import { useAuth } from '../auth/useAuth'
import type { Observation } from '../../shared/db/schema'

type SleepValue          = Observation['sleep']
type AppetiteValue       = Observation['appetite']
type PainValue           = Observation['pain']
type MoodValue           = Observation['mood']
type BowelMovementsValue = Observation['bowel_movements']

const adapter = new WebSpeechAdapter()

const ICON_SIZE   = 22
const ICON_STROKE = 1.75

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-ink-mute mb-2">
      {children}
    </p>
  )
}

const SLEEP_OPTIONS: [SleepValue, string, () => ReactNode, TapTone][] = [
  ['rested',   'Reposé',   () => <Moon    size={ICON_SIZE} strokeWidth={ICON_STROKE} />, 'ok'],
  ['agitated', 'Agité',    () => <Waves   size={ICON_SIZE} strokeWidth={ICON_STROKE} />, 'warn'],
  ['insomnia', 'Insomnie', () => <EyeOff  size={ICON_SIZE} strokeWidth={ICON_STROKE} />, 'alert'],
]

const APPETITE_OPTIONS: [AppetiteValue, string, () => ReactNode, TapTone][] = [
  ['normal',  'Normal', () => <Utensils    size={ICON_SIZE} strokeWidth={ICON_STROKE} />, 'ok'],
  ['low',     'Faible', () => <MinusCircle size={ICON_SIZE} strokeWidth={ICON_STROKE} />, 'warn'],
  ['refused', 'Refus',  () => <XCircle     size={ICON_SIZE} strokeWidth={ICON_STROKE} />, 'alert'],
]

const MOOD_OPTIONS: [MoodValue, string, () => ReactNode, TapTone][] = [
  ['stable',   'Stable',  () => <Check      size={ICON_SIZE} strokeWidth={ICON_STROKE} />, 'ok'],
  ['confused', 'Confus',  () => <HelpCircle size={ICON_SIZE} strokeWidth={ICON_STROKE} />, 'warn'],
  ['anxious',  'Anxieux', () => <Activity   size={ICON_SIZE} strokeWidth={ICON_STROKE} />, 'warn'],
]

const PAIN_GLYPHS: Record<number, () => ReactNode> = {
  1: () => <Smile size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  2: () => <Smile size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  3: () => <Meh   size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  4: () => <Frown size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  5: () => <Frown size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
}

const PAIN_SUBLABELS: Partial<Record<number, string>> = { 1: 'Légère', 3: 'Modérée', 5: 'Sévère' }
const PAIN_TONES:     Record<number, TapTone>         = { 1: 'ok', 2: 'ok', 3: 'warn', 4: 'alert', 5: 'alert' }

// Dot-count SVGs for bowel movements — inline, no Lucide dependency
const DOT_SVG = (dots: number): ReactNode => {
  const cx = dots === 1 ? [12] : dots === 2 ? [7, 17] : [4, 12, 20]
  const r  = dots === 1 ? 4 : dots === 2 ? 3.5 : 3
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinecap="round">
      {dots === 0
        ? <line x1="4" y1="12" x2="20" y2="12" />
        : cx.map((x, i) => <circle key={i} cx={x} cy={12} r={r} />)
      }
    </svg>
  )
}

const BOWEL_OPTIONS: [BowelMovementsValue, string, ReactNode][] = [
  [0, '0',  DOT_SVG(0)],
  [1, '1',  DOT_SVG(1)],
  [2, '2',  DOT_SVG(2)],
  [3, '3+', DOT_SVG(3)],
]

export function PatientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const { session } = useAuth()
  const caregiverId = session?.user.id ?? 'offline'

  const [sleep,           setSleep]          = useState<SleepValue>(null)
  const [appetite,        setAppetite]       = useState<AppetiteValue>(null)
  const [pain,            setPain]           = useState<PainValue>(null)
  const [mood,            setMood]           = useState<MoodValue>(null)
  const [bowelMovements,  setBowelMovements] = useState<BowelMovementsValue>(null)
  const [bowelNote,       setBowelNote]      = useState('')

  const transcription          = useTranscription(adapter)
  const { save, isSaving }     = useSaveObservation(id, caregiverId)
  const hasSelection           = sleep !== null || appetite !== null || pain !== null || mood !== null || bowelMovements !== null

  const handleSubmit = async () => {
    await save({
      sleep,
      appetite,
      pain,
      mood,
      bowel_movements: bowelMovements,
      bowel_note:      bowelNote.trim() || null,
      note_text:       transcription.transcript || null,
      note_audio_url:  null,
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-line-soft">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Retour
        </Button>
        <h1 className="font-display text-xl font-semibold text-ink">Nouvelle observation</h1>
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        {/* Sommeil */}
        <div>
          <SectionLabel>Sommeil</SectionLabel>
          <div role="radiogroup" aria-label="Sommeil" className="flex gap-2">
            {SLEEP_OPTIONS.map(([val, label, glyph, tone]) => (
              <QuickTapButton
                key={String(val)}
                label={label}
                glyph={glyph()}
                tone={tone}
                selected={sleep === val}
                onSelect={() => setSleep((v) => (v === val ? null : val))}
              />
            ))}
          </div>
        </div>

        {/* Appétit */}
        <div>
          <SectionLabel>Appétit</SectionLabel>
          <div role="radiogroup" aria-label="Appétit" className="flex gap-2">
            {APPETITE_OPTIONS.map(([val, label, glyph, tone]) => (
              <QuickTapButton
                key={String(val)}
                label={label}
                glyph={glyph()}
                tone={tone}
                selected={appetite === val}
                onSelect={() => setAppetite((v) => (v === val ? null : val))}
              />
            ))}
          </div>
        </div>

        {/* Douleur */}
        <div>
          <SectionLabel>Douleur</SectionLabel>
          <div role="radiogroup" aria-label="Douleur" className="flex gap-2">
            {([1, 2, 3, 4, 5] as NonNullable<PainValue>[]).map((val) => (
              <QuickTapButton
                key={val}
                label={String(val)}
                glyph={PAIN_GLYPHS[val]!()}
                sublabel={PAIN_SUBLABELS[val]}
                tone={PAIN_TONES[val]}
                selected={pain === val}
                onSelect={() => setPain((v) => (v === val ? null : val))}
              />
            ))}
          </div>
        </div>

        {/* Humeur */}
        <div>
          <SectionLabel>Humeur</SectionLabel>
          <div role="radiogroup" aria-label="Humeur" className="flex gap-2">
            {MOOD_OPTIONS.map(([val, label, glyph, tone]) => (
              <QuickTapButton
                key={String(val)}
                label={label}
                glyph={glyph()}
                tone={tone}
                selected={mood === val}
                onSelect={() => setMood((v) => (v === val ? null : val))}
              />
            ))}
          </div>
        </div>

        {/* Selles */}
        <div>
          <SectionLabel>Selles (nombre)</SectionLabel>
          <div role="radiogroup" aria-label="Selles" className="flex gap-2">
            {BOWEL_OPTIONS.map(([val, label, glyph]) => (
              <QuickTapButton
                key={String(val)}
                label={label}
                glyph={glyph}
                tone="neutral"
                selected={bowelMovements === val}
                onSelect={() => setBowelMovements((v) => (v === val ? null : val))}
              />
            ))}
          </div>
          {bowelMovements !== null && (
            <textarea
              rows={2}
              placeholder="Remarques sur les selles (facultatif)"
              value={bowelNote}
              onChange={(e) => setBowelNote(e.target.value)}
              className="mt-2 w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-bg resize-none"
            />
          )}
        </div>

        {/* Note vocale — hidden when Web Speech API is unavailable */}
        {transcription.state !== 'unsupported' && (
          <div>
            <SectionLabel>Note vocale</SectionLabel>
            <VoiceButton
              state={transcription.state as VoiceState}
              onToggle={
                transcription.state === 'recording'
                  ? transcription.stop
                  : transcription.start
              }
              duration={transcription.duration}
              fullWidth
            />
            {transcription.transcript && (
              <p className="mt-2 text-sm text-ink-2 px-1">{transcription.transcript}</p>
            )}
          </div>
        )}
      </main>

      <footer className="px-4 pb-6 pt-3 border-t border-line-soft">
        <Button
          variant="accent"
          size="lg"
          fullWidth
          disabled={!hasSelection}
          loading={isSaving}
          onClick={handleSubmit}
        >
          Enregistrer
        </Button>
      </footer>
    </div>
  )
}
