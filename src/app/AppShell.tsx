import { SyncIndicator } from '../shared/components/SyncIndicator'
import { ConflictToast } from '../shared/components/ConflictToast'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 bg-bg border-b border-line-soft">
        <span className="font-mono text-[10px] font-bold text-accent tracking-widest">
          PASS·RELAIS
        </span>
        <SyncIndicator />
      </header>
      {children}
      <ConflictToast />
    </>
  )
}
