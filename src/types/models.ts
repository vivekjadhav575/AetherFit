export type ThemeMode = 'light' | 'dark' | 'system'
export type AuthMode = 'guest' | 'google'
export type UserRole = 'member' | 'trainer' | 'admin'
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Pro' | 'Athlete'
export type GoalType = 'fat_loss' | 'muscle_gain' | 'performance' | 'mobility' | 'wellness'
export type WorkoutFocus =
  | 'chest'
  | 'back'
  | 'legs'
  | 'arms'
  | 'shoulders'
  | 'core'
  | 'cardio'
  | 'mobility'
  | 'yoga'
  | 'warm-up'
  | 'cool-down'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Severity = 'info' | 'warning' | 'critical'
export type SyncState = 'idle' | 'syncing' | 'success' | 'error' | 'offline'
export type SupportedExerciseId =
  | 'squat'
  | 'push-up'
  | 'lunge'
  | 'plank'
  | 'shoulder-press'
  | 'bicep-curl'
  | 'jumping-jack'
  | 'cat-cow'
  | 'hip-hinge'

export interface User {
  id: string
  email?: string
  displayName: string
  authMode: AuthMode
  photoUrl?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: string
  userId: string
  name: string
  avatar?: string
  age: number
  gender: string
  heightCm: number
  weightKg: number
  targetWeightKg: number
  dailyCalorieTarget: number
  waterGoalMl: number
  stepGoal: number
  goalType: GoalType
  experienceLevel: ExperienceLevel
  preferredWorkoutStyle: string
  notificationOptIn: boolean
  privacyMode: {
    storeLandmarksOnly: boolean
    allowCloudSync: boolean
    allowCameraSnapshots: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: string
  title: string
  type: GoalType
  targetValue: number
  unit: string
  currentValue: number
  dueDate?: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface Exercise {
  id: SupportedExerciseId | string
  name: string
  category: WorkoutFocus
  description: string
  targetMuscles: string[]
  difficulty: ExperienceLevel
  equipment: string[]
  formTips: string[]
  commonMistakes: string[]
  caloriesPerMinute: number
  suggestedDurationMin?: number
  suggestedReps?: string
  premiumNotes: string
  previewType: 'demo'
  supportedForRealtime: boolean
  updatedAt: string
}

export interface WorkoutPlanItem {
  exerciseId: string
  sets: number
  reps: string
  restSeconds: number
}

export interface WorkoutPlan {
  id: string
  title: string
  description: string
  targetLevel: ExperienceLevel
  goalType: GoalType
  workoutStyle: string
  items: WorkoutPlanItem[]
  unlockLevel: ExperienceLevel
  estimatedMinutes: number
  updatedAt: string
}

export interface FormEvent {
  id: string
  timestamp: string
  exerciseId: string
  code: string
  message: string
  severity: Severity
  scoreImpact: number
}

export interface RepEvent {
  id: string
  repNumber: number
  exerciseId: string
  timestamp: string
  phase: 'up' | 'down' | 'hold' | 'open' | 'closed'
  score: number
}

export interface WorkoutSession {
  id: string
  planId?: string
  exerciseId: string
  startedAt: string
  completedAt?: string
  durationSeconds: number
  repsCompleted: number
  caloriesBurned: number
  averageFormScore: number
  accuracyTrend: number[]
  repEvents: RepEvent[]
  formEvents: FormEvent[]
  recommendations: string[]
  xpGained: number
  notes?: string
  updatedAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: string
  unlocked: boolean
  unlockedAt?: string
  updatedAt: string
}

export interface LevelUnlock {
  title: ExperienceLevel
  minXp: number
  minStreak: number
  minAverageFormScore: number
  minGoalsCompleted: number
  features: string[]
}

export interface LevelProgress {
  currentLevel: ExperienceLevel
  xp: number
  xpToNextLevel: number
  lifetimeXp: number
  longestStreak: number
  currentStreak: number
  averageFormScore: number
  completedGoals: number
  milestoneHistory: string[]
  updatedAt: string
}

export interface MealEntry {
  id: string
  date: string
  mealType: MealType
  title: string
  calories: number
  protein: number
  carbs: number
  fats: number
  notes?: string
  photoDataUrl?: string
  updatedAt: string
}

export interface WaterEntry {
  id: string
  date: string
  amountMl: number
  updatedAt: string
}

export interface SleepEntry {
  id: string
  date: string
  durationHours: number
  quality: number
  updatedAt: string
}

export interface WeightEntry {
  id: string
  date: string
  weightKg: number
  updatedAt: string
}

export interface MoodEntry {
  id: string
  date: string
  mood: number
  energy: number
  notes?: string
  updatedAt: string
}

export interface HabitEntry {
  id: string
  date: string
  name: string
  completed: boolean
  updatedAt: string
}

export interface NotificationPreference {
  workoutReminder: string
  hydrationReminderIntervalMin: number
  mealReminderTimes: string[]
  weeklySummaryDay: number
  recoveryPromptEnabled: boolean
  browserNotificationsEnabled: boolean
  updatedAt: string
}

export interface SyncStatus {
  state: SyncState
  provider: 'local' | 'firebase'
  lastSyncedAt?: string
  lastError?: string
  pendingChanges: number
  updatedAt: string
}

export interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  details: string
  createdAt: string
}

export interface AchievementHistory {
  id: string
  badgeId: string
  earnedAt: string
  source: string
}

export interface Quest {
  id: string
  title: string
  description: string
  target: number
  progress: number
  rewardXp: number
  cadence: 'daily' | 'weekly'
  completed: boolean
  updatedAt: string
}

export interface CalibrationProfile {
  baselineShoulderWidth: number
  baselineHipWidth: number
  framingScore: number
  completedAt: string
}

export interface TrainerAssignment {
  id: string
  planId: string
  assigneeName: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface VoicePreference {
  enabled: boolean
  name?: string
  rate: number
  pitch: number
  minIntervalMs: number
}

export interface AppSettings {
  theme: ThemeMode
  cameraMirrored: boolean
  selectedVoice?: string
  speech: VoicePreference
  reminders: NotificationPreference
  units: 'metric' | 'imperial'
  showAdvancedAnalytics: boolean
  updatedAt: string
}

export interface SmartRecommendation {
  id: string
  title: string
  reason: string
  action: string
  priority: Severity
}

export interface AppSnapshot {
  schemaVersion: number
  user: User
  profile: Profile
  goals: Goal[]
  exercises: Exercise[]
  workoutPlans: WorkoutPlan[]
  workoutSessions: WorkoutSession[]
  mealEntries: MealEntry[]
  waterEntries: WaterEntry[]
  sleepEntries: SleepEntry[]
  weightEntries: WeightEntry[]
  moodEntries: MoodEntry[]
  habitEntries: HabitEntry[]
  badges: Badge[]
  achievementHistory: AchievementHistory[]
  quests: Quest[]
  levelProgress: LevelProgress
  settings: AppSettings
  syncStatus: SyncStatus
  auditLogs: AuditLog[]
  trainerAssignments: TrainerAssignment[]
  favorites: string[]
  recentExerciseIds: string[]
  calibration?: CalibrationProfile
  onboardingCompleted: boolean
  lastActiveDate: string
  updatedAt: string
}
