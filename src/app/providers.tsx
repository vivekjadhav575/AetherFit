import { TooltipProvider } from '@radix-ui/react-tooltip'
import { useEffect } from 'react'
import { Toaster, toast } from 'sonner'

import { refreshCadenceState } from '@/store/default-state'
import { NotificationService } from '@/services/notification-service'
import { useAppStore } from '@/store/app-store'

function resolveTheme(theme: 'light' | 'dark' | 'system') {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function syncTheme(theme: 'light' | 'dark' | 'system') {
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark')
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const initialize = useAppStore((state) => state.initialize)
  const replaceSnapshot = useAppStore((state) => state.replaceSnapshot)
  const initialized = useAppStore((state) => state.initialized)
  const theme = useAppStore((state) => state.snapshot.settings.theme)
  const settings = useAppStore((state) => state.snapshot.settings)
  const snapshot = useAppStore((state) => state.snapshot)

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    syncTheme(theme)

    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => syncTheme(theme)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [theme])

  useEffect(() => {
    if (!initialized) return

    const timer = window.setInterval(() => {
      const current = useAppStore.getState().snapshot
      const refreshed = refreshCadenceState(current)
      if (refreshed.lastActiveDate !== current.lastActiveDate) {
        void replaceSnapshot(refreshed)
      }
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [initialized, replaceSnapshot])

  useEffect(() => {
    if (!initialized) return

    return NotificationService.start({
      snapshot,
      settings,
      onNotify(message) {
        toast(message.title, { description: message.body })
      },
    })
  }, [initialized, settings, snapshot])

  return (
    <TooltipProvider>
      {children}
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  )
}
