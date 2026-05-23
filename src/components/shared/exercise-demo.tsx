import { motion } from 'framer-motion'

import type { Exercise } from '@/types/models'

function getMotionProfile(exerciseId: string) {
  switch (exerciseId) {
    case 'squat':
      return { y: [0, 18, 0], armRotate: [0, 0, 0], legSpread: [1, 1.04, 1] }
    case 'push-up':
      return { y: [0, 14, 0], armRotate: [0, 10, 0], legSpread: [1, 1, 1] }
    case 'jumping-jack':
      return { y: [0, -6, 0], armRotate: [0, -50, 0], legSpread: [1, 1.3, 1] }
    case 'shoulder-press':
      return { y: [0, -6, 0], armRotate: [0, -75, 0], legSpread: [1, 1, 1] }
    case 'bicep-curl':
      return { y: [0, -4, 0], armRotate: [0, -40, 0], legSpread: [1, 1, 1] }
    default:
      return { y: [0, 10, 0], armRotate: [0, -25, 0], legSpread: [1, 1.06, 1] }
  }
}

export function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  const motionProfile = getMotionProfile(exercise.id)
  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-br from-sky-200/45 via-white to-emerald-100/55 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 bg-grid bg-[size:18px_18px] opacity-60" />
      <motion.div
        animate={{ y: motionProfile.y }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.4, ease: 'easeInOut' }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="flex items-end gap-6">
          <motion.div
            animate={{ rotate: motionProfile.armRotate }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.4, ease: 'easeInOut' }}
            className="h-12 w-2 origin-bottom rounded-full bg-primary/80"
          />
          <div className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-full bg-primary/85" />
            <div className="h-12 w-3 rounded-full bg-primary/80" />
          </div>
          <motion.div
            animate={{ rotate: motionProfile.armRotate.map((value) => -value) }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.4, ease: 'easeInOut' }}
            className="h-12 w-2 origin-bottom rounded-full bg-primary/80"
          />
        </div>
        <motion.div
          animate={{ scaleX: motionProfile.legSpread }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.4, ease: 'easeInOut' }}
          className="mt-1 flex gap-6"
        >
          <div className="h-12 w-2 rounded-full bg-primary/75" />
          <div className="h-12 w-2 rounded-full bg-primary/75" />
        </motion.div>
      </motion.div>
      <div className="absolute bottom-3 left-3 rounded-full bg-card/85 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
        Animated demo preview
      </div>
    </div>
  )
}
