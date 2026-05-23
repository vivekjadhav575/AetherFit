import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { LoadingCard } from '@/components/shared/loading-card'
import { useAppStore } from '@/store/app-store'

const AnalyticsPage = lazy(async () => ({ default: (await import('@/features/analytics/analytics-page')).AnalyticsPage }))
const OnboardingPage = lazy(async () => ({ default: (await import('@/features/auth/onboarding-page')).OnboardingPage }))
const DashboardPage = lazy(async () => ({ default: (await import('@/features/dashboard/dashboard-page')).DashboardPage }))
const NutritionPage = lazy(async () => ({ default: (await import('@/features/nutrition/nutrition-page')).NutritionPage }))
const ProfilePage = lazy(async () => ({ default: (await import('@/features/profile/profile-page')).ProfilePage }))
const SettingsPage = lazy(async () => ({ default: (await import('@/features/settings/settings-page')).SettingsPage }))
const LiveWorkoutPage = lazy(async () => ({ default: (await import('@/features/workouts/live-workout-page')).LiveWorkoutPage }))
const WorkoutLibraryPage = lazy(async () => ({ default: (await import('@/features/workouts/workout-library-page')).WorkoutLibraryPage }))

function ProtectedLayout() {
  const onboardingCompleted = useAppStore((state) => state.snapshot.onboardingCompleted)
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <AppShell />
}

function RouteFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </div>
  )
}

function renderLazyPage(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

export function AppRoutes() {
  const initialized = useAppStore((state) => state.initialized)
  const onboardingCompleted = useAppStore((state) => state.snapshot.onboardingCompleted)

  if (!initialized) {
    return <RouteFallback />
  }

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={onboardingCompleted ? <Navigate to="/" replace /> : renderLazyPage(<OnboardingPage />)}
      />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={renderLazyPage(<DashboardPage />)} />
        <Route path="/coach" element={renderLazyPage(<LiveWorkoutPage />)} />
        <Route path="/library" element={renderLazyPage(<WorkoutLibraryPage />)} />
        <Route path="/nutrition" element={renderLazyPage(<NutritionPage />)} />
        <Route path="/analytics" element={renderLazyPage(<AnalyticsPage />)} />
        <Route path="/profile" element={renderLazyPage(<ProfilePage />)} />
        <Route path="/settings" element={renderLazyPage(<SettingsPage />)} />
      </Route>
      <Route path="*" element={<Navigate to={onboardingCompleted ? '/' : '/onboarding'} replace />} />
    </Routes>
  )
}
