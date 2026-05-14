export type ShiftWindow =
  | { preset: 8 | 10 | 12 | 24 }
  | { since: Date }

export function windowStart(w: ShiftWindow): Date {
  if ('preset' in w) return new Date(Date.now() - w.preset * 3_600_000)
  return w.since
}

export function formatWindowLabel(w: ShiftWindow): string {
  const since = windowStart(w)
  const now   = new Date()
  const fmt   = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `Garde ${fmt(since)} → ${fmt(now)}`
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]!
}
