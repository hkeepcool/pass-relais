import { BrowserRouter } from 'react-router-dom'
import { Providers } from './providers'
import { Router } from './Router'
import { AppShell } from './AppShell'
import { useSyncQueue } from '../shared/hooks/useSyncQueue'

function AppMain() {
  useSyncQueue()
  return (
    <main>
      <Router />
    </main>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppShell>
          <AppMain />
        </AppShell>
      </Providers>
    </BrowserRouter>
  )
}
