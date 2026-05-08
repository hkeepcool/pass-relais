import { vi } from 'vitest'

export const mockStartRegistration = vi.fn()
export const mockStartAuthentication = vi.fn()

vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: mockStartRegistration,
  startAuthentication: mockStartAuthentication,
}))
