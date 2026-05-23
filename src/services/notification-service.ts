import { format, startOfWeek } from 'date-fns'

import type { AppSettings, AppSnapshot } from '@/types/models'

interface NotificationPayload {
  title: string
  body: string
}

function maybeBrowserNotify(payload: NotificationPayload, settings: AppSettings) {
  if (!settings.reminders.browserNotificationsEnabled) return
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(payload.title, { body: payload.body })
    setTimeout(() => notification.close(), 6000)
  }
}

function emitNotification(payload: NotificationPayload, settings: AppSettings, onNotify: (payload: NotificationPayload) => void) {
  onNotify(payload)
  maybeBrowserNotify(payload, settings)
}

function shouldFireAtTime(target: string, now: Date) {
  return format(now, 'HH:mm') === target
}

function weeklyKey(now: Date) {
  return format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export const NotificationService = {
  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.requestPermission()
  },

  start({
    snapshot,
    settings,
    onNotify,
  }: {
    snapshot: AppSnapshot
    settings: AppSettings
    onNotify: (payload: NotificationPayload) => void
  }) {
    let lastHydrationPingAt = Date.now()
    let lastWorkoutPing = ''
    let lastMealPing = ''
    let lastRecoveryPing = ''
    let lastWeeklySummaryPing = ''

    const timer = window.setInterval(() => {
      const now = new Date()
      const today = format(now, 'yyyy-MM-dd')
      const currentTime = format(now, 'HH:mm')
      const todayWaterTotal = snapshot.waterEntries
        .filter((entry) => entry.date === today)
        .reduce((sum, entry) => sum + entry.amountMl, 0)
      const completedWorkoutToday = snapshot.workoutSessions.some((session) => (session.completedAt ?? session.startedAt).startsWith(today))
      const sleepLoggedToday = snapshot.sleepEntries.some((entry) => entry.date === today)

      if (shouldFireAtTime(settings.reminders.workoutReminder, now) && !completedWorkoutToday && lastWorkoutPing !== today) {
        emitNotification(
          { title: 'Workout window is open', body: 'Protect your streak with a coached session today.' },
          settings,
          onNotify,
        )
        lastWorkoutPing = today
      }

      if (
        settings.reminders.mealReminderTimes.some((time) => shouldFireAtTime(time, now)) &&
        lastMealPing !== `${today}-${currentTime}`
      ) {
        emitNotification(
          { title: 'Nutrition check-in', body: 'Log your meal while it is still fresh in memory.' },
          settings,
          onNotify,
        )
        lastMealPing = `${today}-${currentTime}`
      }

      if (settings.reminders.hydrationReminderIntervalMin > 0 && todayWaterTotal < snapshot.profile.waterGoalMl) {
        const intervalMs = settings.reminders.hydrationReminderIntervalMin * 60_000
        if (Date.now() - lastHydrationPingAt >= intervalMs) {
          emitNotification(
            { title: 'Hydration nudge', body: 'A quick water log now can keep your recovery on track.' },
            settings,
            onNotify,
          )
          lastHydrationPingAt = Date.now()
        }
      } else {
        lastHydrationPingAt = Date.now()
      }

      if (settings.reminders.recoveryPromptEnabled && shouldFireAtTime('21:00', now) && !sleepLoggedToday && lastRecoveryPing !== today) {
        emitNotification(
          { title: 'Recovery check', body: 'Log your sleep plan so tomorrow starts with a clear recovery target.' },
          settings,
          onNotify,
        )
        lastRecoveryPing = today
      }

      const activeWeek = weeklyKey(now)
      if (now.getDay() === settings.reminders.weeklySummaryDay && shouldFireAtTime('12:00', now) && lastWeeklySummaryPing !== activeWeek) {
        emitNotification(
          {
            title: 'Weekly summary ready',
            body: `${snapshot.levelProgress.currentStreak} day streak, ${snapshot.workoutSessions.length} total workouts, ${snapshot.levelProgress.xp} XP so far.`,
          },
          settings,
          onNotify,
        )
        lastWeeklySummaryPing = activeWeek
      }
    }, 60_000)

    return () => window.clearInterval(timer)
  },
}
