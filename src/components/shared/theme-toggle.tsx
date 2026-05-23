import { Moon, Sun, SunMoon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

export function ThemeToggle() {
  const theme = useAppStore((state) => state.snapshot.settings.theme)
  const updateSettings = useAppStore((state) => state.updateSettings)

  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : SunMoon

  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => {
        void updateSettings({ theme: nextTheme })
      }}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
