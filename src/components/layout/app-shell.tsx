import { Activity, BarChart3, BrainCircuit, LayoutDashboard, Salad, Settings2, Shield, UserCircle2 } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/coach', label: 'Live Coach', icon: BrainCircuit },
  { to: '/library', label: 'Workout Library', icon: Activity },
  { to: '/nutrition', label: 'Nutrition', icon: Salad },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

export function AppShell() {
  const profile = useAppStore((state) => state.snapshot.profile)
  const levelProgress = useAppStore((state) => state.snapshot.levelProgress)
  const syncStatus = useAppStore((state) => state.snapshot.syncStatus)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.8),rgba(241,245,249,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_22%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98))]" />
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-white/10 px-5 py-6 lg:flex lg:flex-col">
          <Link to="/" className="mb-8 flex items-center gap-3">
            <div className="rounded-[24px] bg-primary px-4 py-3 font-display text-xl font-bold text-primary-foreground shadow-soft">
              A
            </div>
            <div>
              <p className="font-display text-lg font-semibold">AetherFit</p>
              <p className="text-sm text-muted-foreground">Adaptive wellness system</p>
            </div>
          </Link>

          <div className="mb-6 rounded-[28px] bg-card/80 p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback>{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{levelProgress.currentLevel} rank</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-background/70 px-3 py-2 text-sm shadow-inset">
              <span>{levelProgress.xp} XP</span>
              <Badge variant="success">{levelProgress.currentStreak} day streak</Badge>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground',
                    isActive && 'bg-card text-foreground shadow-soft',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3 rounded-[28px] bg-card/80 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sync state</p>
                <p className="text-sm text-muted-foreground">{syncStatus.provider === 'firebase' ? 'Cloud sync active' : 'Local-first mode'}</p>
              </div>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <Badge variant={syncStatus.state === 'error' ? 'danger' : syncStatus.state === 'success' ? 'success' : 'muted'}>
              {syncStatus.state}
            </Badge>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-background/70 px-4 py-3 backdrop-blur-xl lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold">Train sharper, recover smarter</p>
                <p className="text-sm text-muted-foreground">Live posture coaching, nutrition logging, and streak-driven motivation.</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button asChild variant="secondary" className="hidden sm:inline-flex">
                  <Link to="/coach">Start workout</Link>
                </Button>
              </div>
            </div>
          </header>

          <ScrollArea className="flex-1">
            <main className="container px-4 py-6 lg:px-8">
              <Outlet />
            </main>
          </ScrollArea>

          <footer className="border-t border-white/10 px-4 py-4 text-center text-xs text-muted-foreground lg:hidden">
            Fitness guidance only. Not medical advice.
          </footer>
        </div>
      </div>
    </div>
  )
}
