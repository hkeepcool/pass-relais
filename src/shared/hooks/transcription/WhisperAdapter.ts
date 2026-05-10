import type { TranscriptionAdapter } from '../useTranscription'

export class WhisperAdapter implements TranscriptionAdapter {
  isSupported(): boolean { return false }

  start(_onInterim: (t: string) => void, _onFinal: (t: string) => void): void {
    throw new Error('WhisperAdapter not yet implemented — wire up the transcribe-audio Edge Function first')
  }

  stop(): void {}
}
