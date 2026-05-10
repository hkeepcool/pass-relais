// SpeechRecognition is not yet universally in lib.dom.d.ts
declare global {
  interface Window {
    SpeechRecognition: (new () => SpeechRecognition) | undefined
    webkitSpeechRecognition: (new () => SpeechRecognition) | undefined
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onspeechend: (() => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  }
  interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: SpeechRecognitionResultList
  }
  interface SpeechRecognitionResultList {
    readonly length: number
    [index: number]: SpeechRecognitionResult | undefined
  }
  interface SpeechRecognitionResult {
    readonly isFinal: boolean
    readonly length: number
    [index: number]: SpeechRecognitionAlternative | undefined
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string
  }
}

import type { TranscriptionAdapter } from '../useTranscription'

export class WebSpeechAdapter implements TranscriptionAdapter {
  private recognition: SpeechRecognition | null = null

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }

  start(onInterim: (t: string) => void, onFinal: (t: string) => void): void {
    const Impl = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Impl) return

    this.recognition = new Impl()
    this.recognition.continuous     = true
    this.recognition.interimResults = true
    this.recognition.lang           = 'fr-FR'

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final   = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (!r) continue
        if (r.isFinal) final   += r[0]?.transcript ?? ''
        else           interim += r[0]?.transcript ?? ''
      }
      if (final)        onFinal(final.trim())
      else if (interim) onInterim(interim.trim())
    }

    this.recognition.onspeechend = () => this.stop()
    this.recognition.start()
  }

  stop(): void {
    this.recognition?.stop()
    this.recognition = null
  }
}
