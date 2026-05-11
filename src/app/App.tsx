import { BrowserRouter } from 'react-router-dom'
import { Providers } from './providers'
import { Router } from './Router'
import { useSyncQueue } from '../shared/hooks/useSyncQueue'

function AppMain() {
  useSyncQueue()
  return <Router />
}

export function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppMain />
      </Providers>
    </BrowserRouter>
  )
}
