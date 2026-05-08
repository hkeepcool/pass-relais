import { BrowserRouter } from 'react-router-dom'
import { Providers } from './providers'
import { Router } from './Router'
import { SyncIndicator } from '../shared/components/SyncIndicator'
import { Toast } from '../shared/components/Toast'
import { useSyncQueue } from '../shared/hooks/useSyncQueue'

function AppShell() {
  useSyncQueue()
  return (
    <>
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="font-semibold text-blue-700">Pass-Relais</span>
        <SyncIndicator />
      </header>
      <main>
        <Router />
      </main>
      <Toast />
    </>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppShell />
      </Providers>
    </BrowserRouter>
  )
}
