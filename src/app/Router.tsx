import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage'
import { AuthGuard } from '../features/auth/AuthGuard'
import { PatientListPage } from '../features/patients/PatientListPage'
import { PatientDetailPage } from '../features/patients/PatientDetailPage'
import { FeedPage } from '../features/transmissions/FeedPage'

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/patients" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/patients"
        element={
          <AuthGuard>
            <PatientListPage />
          </AuthGuard>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <AuthGuard>
            <PatientDetailPage />
          </AuthGuard>
        }
      />
      <Route
        path="/patients/:id/feed"
        element={
          <AuthGuard>
            <FeedPage />
          </AuthGuard>
        }
      />
    </Routes>
  )
}
