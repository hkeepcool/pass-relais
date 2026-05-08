import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('supabase client', () => {
  beforeEach(() => {
    vi.resetModules()
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-key'
  })

  it('exports a supabase client', async () => {
    const { supabase } = await import('./supabase')
    expect(supabase).toBeDefined()
    expect(typeof supabase.auth.getSession).toBe('function')
  })
})
