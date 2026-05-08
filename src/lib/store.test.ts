import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './store'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      isOnline: true,
      syncQueue: [],
      conflicts: [],
    })
  })

  it('enqueues a sync item with generated id and timestamp', () => {
    useAppStore.getState().enqueue({ operation: 'INSERT', table: 'observations', payload: { id: 'abc' } })
    const queue = useAppStore.getState().syncQueue
    expect(queue).toHaveLength(1)
    expect(queue[0]?.id).toBeDefined()
    expect(queue[0]?.retries).toBe(0)
    expect(queue[0]?.table).toBe('observations')
  })

  it('removes item from queue by id', () => {
    useAppStore.getState().enqueue({ operation: 'INSERT', table: 'observations', payload: {} })
    const id = useAppStore.getState().syncQueue[0]!.id
    useAppStore.getState().removeFromQueue(id)
    expect(useAppStore.getState().syncQueue).toHaveLength(0)
  })

  it('increments retries', () => {
    useAppStore.getState().enqueue({ operation: 'INSERT', table: 'observations', payload: {} })
    const id = useAppStore.getState().syncQueue[0]!.id
    useAppStore.getState().incrementRetries(id)
    expect(useAppStore.getState().syncQueue[0]?.retries).toBe(1)
  })

  it('adds and clears conflicts', () => {
    useAppStore.getState().addConflict({ patientName: 'Alice', table: 'observations', id: 'x1' })
    expect(useAppStore.getState().conflicts).toHaveLength(1)
    useAppStore.getState().clearConflict('x1')
    expect(useAppStore.getState().conflicts).toHaveLength(0)
  })
})
