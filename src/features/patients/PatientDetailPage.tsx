import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QuickTapButton, Button, VoiceButton } from '../../design-system'
import type { TapTone, VoiceState } from '../../design-system'
import { useTranscription } from '../../shared/hooks/useTranscription'
import { WebSpeechAdapter } from '../../shared/hooks/transcription/WebSpeechAdapter'
import { useSaveObservation } from './useSaveObservation'
import { useAuth } from '../auth/useAuth'
import type { Observation } from '../../shared/db/schema'

type SleepValue    = Observation['sleep']
type AppetiteValue = Observation['appetite']
type PainValue     = Observation['pain']
type MoodValue     = Observation['mood']

const adapter = new WebSpeechAdapter()

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-ink-mute mb-2">
      {children}
    </p>
  )
}

const SLEEP_OPTIONS: [SleepValue, string, string, TapTone][] = [
  ['rested',   'Reposé',  '☾', 'ok'],
  ['agitated', 'Agité',   '〜', 'warn'],
  ['insomnia', 'Insomnie','◎', 'alert'],
]

const APPETITE_OPTIONS: [AppetiteValue, string, string, TapTone][] = [
  ['normal',  'Normal', '◉', 'ok'],
  ['low',     'Faible', '◌', 'warn'],
  ['refused', 'Refus',  '✕', 'alert'],
]

const MOOD_OPTIONS: [MoodValue, string, string, TapTone][] = [
  ['stable',   'Stable', '◆', 'ok'],
  ['confused', 'Confus', '?', 'warn'],
  ['anxious',  'Anxieux','!', 'warn'],
]

const PAIN_GLYPHS:    Record<number, string>           = { 1: '●', 2: '●●', 3: '●●●', 4: '▲', 5: '⚠' }
const PAIN_SUBLABELS: Partial<Record<number, string>>  = { 1: 'Légère', 3: 'Modérée', 5: 'Sévère' }
const PAIN_TONES:     Record<number, TapTone>          = { 1: 'ok', 2: 'ok', 3: 'warn', 4: 'alert', 5: 'alert' }

export function PatientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const { session } = useAuth()
  const caregiverId = session?.user.id ?? 'offline'

  const [sleep,    setSleep]    = useState<SleepValue>(null)
  const [appetite, setAppetite] = useState<AppetiteValue>(null)
  const [pain,     setPain]     = useState<PainValue>(null)
  const [mood,     setMood]     = useState<MoodValue>(null)

  const transcription          = useTranscription(adapter)
  const { save, isSaving }     = useSaveObservation(id, caregiverId)
  const hasSelection           = sleep !== null || appetite !== null || pain !== null || mood !== null

  const handleSubmit = async () => {
    await save({
      sleep,
      appetite,
      pain,
      mood,
      note_text:      transcription.transcript || null,
      note_audio_url: null,
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
                glyph={glyph}
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
                glyph={glyph}
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
                glyph={PAIN_GLYPHS[val]}
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
                glyph={glyph}
                tone={tone}
                selected={mood === val}
                onSelect={() => setMood((v) => (v === val ? null : val))}
              />
            ))}
          </div>
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
