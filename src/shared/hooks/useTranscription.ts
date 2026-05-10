import { useState, useEffect, useRef, useCallback } from 'react'

export interface TranscriptionAdapter {
  start(onInterim: (t: string) => void, onFinal: (t: string) => void): void
  stop(): void
  isSupported(): boolean
}

export interface TranscriptionResult {
  state:      'idle' | 'recording' | 'done' | 'unsupported'
  transcript: string
  duration:   number
  start:      () => void
  stop:       () => void
  reset:      () => void
}

export function useTranscription(adapter: TranscriptionAdapter): TranscriptionResult {
  const [state,      setState]      = useState<TranscriptionResult['state']>(
    () => (adapter.isSupported() ? 'idle' : 'unsupported'),
  )
  const [transcript, setTranscript] = useState('')
  const [duration,   setDuration]   = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (state !== 'idle') return
    setState('recording')
    setTranscript('')
    setDuration(0)
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    adapter.start(
      (interim) => setTranscript(interim),
      (final) => {
        setTranscript(final)
        setState('done')
        if (timerRef.current) clearInterval(timerRef.current)
      },
    )
  }, [state, adapter])

  const stop = useCallback(() => {
    if (state !== 'recording') return
    adapter.stop()
    setState('done')
    if (timerRef.current) clearInterval(timerRef.current)
  }, [state, adapter])

  const reset = useCallback(() => {
    setState(adapter.isSupported() ? 'idle' : 'unsupported')
    setTranscript('')
    setDuration(0)
  }, [adapter])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  return { state, transcript, duration, start, stop, reset }
}
