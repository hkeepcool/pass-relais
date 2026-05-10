import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTranscription } from './useTranscription'
import type { TranscriptionAdapter } from './useTranscription'

function makeMockAdapter(supported = true): TranscriptionAdapter {
  return { isSupported: () => supported, start: vi.fn(), stop: vi.fn() }
}

describe('useTranscription', () => {
  it('state is unsupported when adapter.isSupported() returns false', () => {
    const { result } = renderHook(() => useTranscription(makeMockAdapter(false)))
    expect(result.current.state).toBe('unsupported')
  })

  it('state is idle when adapter is supported', () => {
    const { result } = renderHook(() => useTranscription(makeMockAdapter()))
    expect(result.current.state).toBe('idle')
  })

  it('calls adapter.start() and transitions to recording on start()', () => {
    const adapter = makeMockAdapter()
    const { result } = renderHook(() => useTranscription(adapter))
    act(() => result.current.start())
    expect(adapter.start).toHaveBeenCalledOnce()
    expect(result.current.state).toBe('recording')
  })

  it('transitions to done and sets transcript when onFinal fires', () => {
    let capturedOnFinal: ((t: string) => void) | null = null
    const adapter: TranscriptionAdapter = {
      isSupported: () => true,
      start: vi.fn((_onInterim, onFinal) => { capturedOnFinal = onFinal }),
      stop: vi.fn(),
    }
    const { result } = renderHook(() => useTranscription(adapter))
    act(() => result.current.start())
    act(() => capturedOnFinal!('bonjour le patient'))
    expect(result.current.state).toBe('done')
    expect(result.current.transcript).toBe('bonjour le patient')
  })

  it('calls adapter.stop() and transitions to done on stop()', () => {
    const adapter = makeMockAdapter()
    const { result } = renderHook(() => useTranscription(adapter))
    act(() => result.current.start())
    act(() => result.current.stop())
    expect(adapter.stop).toHaveBeenCalledOnce()
    expect(result.current.state).toBe('done')
  })

  it('reset() returns state to idle and clears transcript', () => {
    let capturedOnFinal: ((t: string) => void) | null = null
    const adapter: TranscriptionAdapter = {
      isSupported: () => true,
      start: vi.fn((_onInterim, onFinal) => { capturedOnFinal = onFinal }),
      stop: vi.fn(),
    }
    const { result } = renderHook(() => useTranscription(adapter))
    act(() => result.current.start())
    act(() => capturedOnFinal!('test transcript'))
    act(() => result.current.reset())
    expect(result.current.state).toBe('idle')
    expect(result.current.transcript).toBe('')
  })
})
