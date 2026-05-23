import { BellRing, Cloud, Download, Import, Mic2, Palette, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { fetchCloudSnapshot, isFirebaseAvailable, signInWithGoogle, signOutGoogle, watchAuthState, writeCloudSnapshot } from '@/lib/firebase'
import { sanitizeImportedSnapshot } from '@/lib/imported-snapshot'
import { exportSnapshotJson, exportWorkoutCsv, importSnapshotFile } from '@/services/export-service'
import { NotificationService } from '@/services/notification-service'
import { mergeSnapshots } from '@/services/sync-service'
import { useAppStore } from '@/store/app-store'

const weekDayOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

const mealReminderLabels = ['Breakfast reminder', 'Lunch reminder', 'Dinner reminder']

export function SettingsPage() {
  const snapshot = useAppStore((state) => state.snapshot)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const replaceSnapshot = useAppStore((state) => state.replaceSnapshot)
  const deleteAllData = useAppStore((state) => state.deleteAllData)
  const setSyncStatus = useAppStore((state) => state.setSyncStatus)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [cloudBusy, setCloudBusy] = useState(false)

  function updateMealReminder(index: number, value: string) {
    const nextTimes = [...snapshot.settings.reminders.mealReminderTimes]
    nextTimes[index] = value
    void updateSettings({
      reminders: {
        ...snapshot.settings.reminders,
        mealReminderTimes: nextTimes,
      },
    })
  }

  async function connectGoogle() {
    if (!isFirebaseAvailable()) {
      toast.error('Firebase is not configured.')
      return
    }

    try {
      const firebaseUser = await signInWithGoogle()
      if (!firebaseUser) {
        toast.error('Google sign-in did not return a user session.')
        return
      }

      await replaceSnapshot({
        ...snapshot,
        user: {
          ...snapshot.user,
          id: firebaseUser.uid,
          authMode: 'google',
          email: firebaseUser.email ?? undefined,
          displayName: firebaseUser.displayName ?? snapshot.user.displayName,
          photoUrl: firebaseUser.photoURL ?? undefined,
          updatedAt: new Date().toISOString(),
        },
        syncStatus: {
          ...snapshot.syncStatus,
          provider: snapshot.profile.privacyMode.allowCloudSync ? 'firebase' : 'local',
          updatedAt: new Date().toISOString(),
        },
      })

      toast.success(snapshot.profile.privacyMode.allowCloudSync ? 'Signed in with Google' : 'Signed in with Google. Cloud sync still off.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google sign-in failed.')
    }
  }

  async function syncNow() {
    if (!snapshot.profile.privacyMode.allowCloudSync) {
      toast.error('Enable cloud sync in privacy settings before syncing.')
      return
    }
    if (!isFirebaseAvailable()) {
      toast.error('Firebase environment variables are missing.')
      return
    }

    setCloudBusy(true)
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      unsubscribe()
      if (!firebaseUser) {
        toast.error('Sign in with Google before syncing.')
        setCloudBusy(false)
        return
      }

      try {
        await setSyncStatus({ ...snapshot.syncStatus, state: 'syncing', provider: 'firebase', updatedAt: new Date().toISOString() })
        const cloudSnapshot = await fetchCloudSnapshot(firebaseUser.uid)
        const safeRemoteSnapshot = cloudSnapshot ? sanitizeImportedSnapshot(cloudSnapshot) : null
        const merged = safeRemoteSnapshot ? mergeSnapshots(snapshot, safeRemoteSnapshot) : snapshot
        const syncedSnapshot = {
          ...merged,
          user: {
            ...merged.user,
            id: firebaseUser.uid,
            authMode: 'google' as const,
            email: firebaseUser.email ?? undefined,
            displayName: firebaseUser.displayName ?? merged.user.displayName,
            photoUrl: firebaseUser.photoURL ?? undefined,
            updatedAt: new Date().toISOString(),
          },
          syncStatus: {
            state: 'success' as const,
            provider: 'firebase' as const,
            lastSyncedAt: new Date().toISOString(),
            pendingChanges: 0,
            updatedAt: new Date().toISOString(),
          },
        }

        await writeCloudSnapshot(firebaseUser.uid, syncedSnapshot)
        await replaceSnapshot(syncedSnapshot)
        toast.success('Cloud sync complete')
      } catch (error) {
        await setSyncStatus({
          state: 'error',
          provider: 'firebase',
          lastError: error instanceof Error ? error.message : 'Sync failed.',
          pendingChanges: snapshot.syncStatus.pendingChanges,
          updatedAt: new Date().toISOString(),
        })
        toast.error(error instanceof Error ? error.message : 'Cloud sync failed.')
      } finally {
        setCloudBusy(false)
      }
    })
  }

  async function requestNotificationPermission() {
    const permission = await NotificationService.requestPermission()
    if (permission === 'granted') {
      await updateSettings({
        reminders: {
          ...snapshot.settings.reminders,
          browserNotificationsEnabled: true,
        },
      })
    }
    toast.success(`Notification permission: ${permission}`)
  }

  async function handleSignOut() {
    await signOutGoogle()
    await replaceSnapshot({
      ...snapshot,
      user: {
        ...snapshot.user,
        id: 'guest-user',
        authMode: 'guest',
        email: undefined,
        photoUrl: undefined,
        updatedAt: new Date().toISOString(),
      },
      syncStatus: {
        ...snapshot.syncStatus,
        provider: 'local',
        state: 'idle',
        lastError: undefined,
        updatedAt: new Date().toISOString(),
      },
    })
    toast.success('Signed out of Google')
  }

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Settings and privacy" title="Theme, voice, reminders, sync, and data controls" description="Personalize the interface, manage browser permissions, and control where your data lives." />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><div><CardTitle>Appearance and coaching</CardTitle><CardDescription>Adjust theme, camera mirroring, and real-time voice feedback.</CardDescription></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
              <div className="mb-3 flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /><p className="font-semibold">Theme mode</p></div>
              <Select value={snapshot.settings.theme} onValueChange={(value) => void updateSettings({ theme: value as typeof snapshot.settings.theme })}>
                <SelectTrigger aria-label="Theme mode"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="system">System</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-background/70 p-4 shadow-inset"><div><p className="font-semibold">Mirror camera preview</p><p className="text-sm text-muted-foreground">Helps front-camera movements feel more intuitive.</p></div><Switch aria-label="Mirror camera preview" checked={snapshot.settings.cameraMirrored} onCheckedChange={(checked) => void updateSettings({ cameraMirrored: checked })} /></div>
            <div className="flex items-center justify-between rounded-2xl bg-background/70 p-4 shadow-inset"><div><p className="font-semibold">Voice coaching</p><p className="text-sm text-muted-foreground">Speak only on state changes or critical posture issues.</p></div><Switch aria-label="Voice coaching" checked={snapshot.settings.speech.enabled} onCheckedChange={(checked) => void updateSettings({ speech: { ...snapshot.settings.speech, enabled: checked } })} /></div>
            <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
              <div className="mb-3 flex items-center gap-2"><Mic2 className="h-4 w-4 text-primary" /><p className="font-semibold">Speech interval</p></div>
              <Input aria-label="Speech interval" type="number" value={snapshot.settings.speech.minIntervalMs} onChange={(event) => void updateSettings({ speech: { ...snapshot.settings.speech, minIntervalMs: Number(event.target.value) } })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><CardTitle>Reminders and permissions</CardTitle><CardDescription>Browser notifications work while the app is open and active in supported browsers.</CardDescription></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-background/70 p-4 shadow-inset"><div className="mb-3 flex items-center gap-2"><BellRing className="h-4 w-4 text-primary" /><p className="font-semibold">Workout reminder time</p></div><Input aria-label="Workout reminder time" type="time" value={snapshot.settings.reminders.workoutReminder} onChange={(event) => void updateSettings({ reminders: { ...snapshot.settings.reminders, workoutReminder: event.target.value } })} /></div>
            <div className="rounded-2xl bg-background/70 p-4 shadow-inset"><p className="mb-2 font-semibold">Hydration reminder interval (minutes)</p><Input aria-label="Hydration reminder interval" type="number" value={snapshot.settings.reminders.hydrationReminderIntervalMin} onChange={(event) => void updateSettings({ reminders: { ...snapshot.settings.reminders, hydrationReminderIntervalMin: Number(event.target.value) } })} /></div>
            {mealReminderLabels.map((label, index) => (
              <div key={label} className="rounded-2xl bg-background/70 p-4 shadow-inset">
                <p className="mb-2 font-semibold">{label}</p>
                <Input aria-label={label} type="time" value={snapshot.settings.reminders.mealReminderTimes[index] ?? ''} onChange={(event) => updateMealReminder(index, event.target.value)} />
              </div>
            ))}
            <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
              <p className="mb-2 font-semibold">Weekly summary day</p>
              <Select value={String(snapshot.settings.reminders.weeklySummaryDay)} onValueChange={(value) => void updateSettings({ reminders: { ...snapshot.settings.reminders, weeklySummaryDay: Number(value) } })}>
                <SelectTrigger aria-label="Weekly summary day"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {weekDayOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-background/70 p-4 shadow-inset"><div><p className="font-semibold">Recovery prompt</p><p className="text-sm text-muted-foreground">Send an evening reminder if sleep is not logged yet.</p></div><Switch aria-label="Recovery prompt" checked={snapshot.settings.reminders.recoveryPromptEnabled} onCheckedChange={(checked) => void updateSettings({ reminders: { ...snapshot.settings.reminders, recoveryPromptEnabled: checked } })} /></div>
            <div className="flex items-center justify-between rounded-2xl bg-background/70 p-4 shadow-inset"><div><p className="font-semibold">Browser notifications</p><p className="text-sm text-muted-foreground">Use native browser notifications in addition to in-app toasts.</p></div><Switch aria-label="Browser notifications" checked={snapshot.settings.reminders.browserNotificationsEnabled} onCheckedChange={(checked) => void updateSettings({ reminders: { ...snapshot.settings.reminders, browserNotificationsEnabled: checked } })} /></div>
            <Button variant="secondary" onClick={() => void requestNotificationPermission()}>
              Request notification permission
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><div><CardTitle>Sync and account</CardTitle><CardDescription>Stay local-first or connect Google for cross-device cloud sync.</CardDescription></div><Badge variant={snapshot.syncStatus.state === 'success' ? 'success' : snapshot.syncStatus.state === 'error' ? 'danger' : 'secondary'}>{snapshot.syncStatus.state}</Badge></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-background/70 p-4 shadow-inset">
              <div className="mb-2 flex items-center gap-2"><Cloud className="h-4 w-4 text-primary" /><p className="font-semibold">Cloud provider</p></div>
              <p className="text-sm text-muted-foreground">{isFirebaseAvailable() ? 'Firebase auth and Firestore sync are configured through environment variables.' : 'Firebase is not configured yet. The app remains fully usable in local-first guest mode.'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{snapshot.profile.privacyMode.allowCloudSync ? 'Cloud sync is allowed for this profile.' : 'Cloud sync is disabled in privacy controls.'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void connectGoogle()}>Connect Google</Button>
              <Button variant="secondary" disabled={cloudBusy || !snapshot.profile.privacyMode.allowCloudSync} onClick={() => void syncNow()}>Sync now</Button>
              <Button variant="outline" onClick={() => void handleSignOut()}>Sign out</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><CardTitle>Privacy and data controls</CardTitle><CardDescription>Choose what gets stored and how your data can be backed up or deleted.</CardDescription></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-background/70 p-4 shadow-inset"><div><p className="font-semibold">Store landmarks instead of video</p><p className="text-sm text-muted-foreground">Raw video is never stored unless you explicitly enable it later.</p></div><Switch aria-label="Store landmarks instead of video" checked={snapshot.profile.privacyMode.storeLandmarksOnly} onCheckedChange={(checked) => void replaceSnapshot({ ...snapshot, profile: { ...snapshot.profile, privacyMode: { ...snapshot.profile.privacyMode, storeLandmarksOnly: checked }, updatedAt: new Date().toISOString() } })} /></div>
            <div className="flex items-center justify-between rounded-2xl bg-background/70 p-4 shadow-inset"><div><p className="font-semibold">Allow cloud sync</p><p className="text-sm text-muted-foreground">When disabled, the app stays local-first even after sign-in.</p></div><Switch aria-label="Allow cloud sync" checked={snapshot.profile.privacyMode.allowCloudSync} onCheckedChange={(checked) => void replaceSnapshot({ ...snapshot, profile: { ...snapshot.profile, privacyMode: { ...snapshot.profile.privacyMode, allowCloudSync: checked }, updatedAt: new Date().toISOString() }, syncStatus: { ...snapshot.syncStatus, provider: checked && snapshot.user.authMode === 'google' ? 'firebase' : 'local', state: checked ? snapshot.syncStatus.state : 'idle', updatedAt: new Date().toISOString() } })} /></div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => exportSnapshotJson(snapshot)}><Download className="h-4 w-4" />Export JSON</Button>
              <Button variant="secondary" onClick={() => exportWorkoutCsv(snapshot)}><Download className="h-4 w-4" />Export CSV</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Import className="h-4 w-4" />Import backup</Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (event) => {
                  try {
                    const file = event.target.files?.[0]
                    if (!file) return
                    const imported = await importSnapshotFile(file)
                    await replaceSnapshot(imported)
                    toast.success('Backup imported successfully')
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Backup import failed.')
                  } finally {
                    event.currentTarget.value = ''
                  }
                }}
              />
            </div>
            <Button variant="danger" onClick={() => void deleteAllData()}><Trash2 className="h-4 w-4" />Reset local account data</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
