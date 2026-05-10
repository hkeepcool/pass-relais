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
    const Impl =
      window.SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!Impl) return

    this.recognition = new Impl()
    this.recognition.continuous     = true
    this.recognition.interimResults = true
    this.recognition.lang           = 'fr-FR'

    this.recognition.onresult = (event) => {
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
