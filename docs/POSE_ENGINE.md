# Pose Engine Explanation

## Runtime pieces

- `src/services/pose-engine.ts`: loads MediaPipe Pose Landmarker
- `src/hooks/use-live-pose.ts`: owns webcam state, frame loop, confidence, lag, lighting, voice cues, and session event capture
- `src/features/pose/landmarks.ts`: low-level geometry helpers
- `src/features/pose/form-model.ts`: browser-side model adapter and hybrid score blender
- `src/features/pose/posture-rules.ts`: exercise-specific rules engine
- `src/features/pose/pose-canvas.ts`: skeleton overlay rendering

## Supported live exercises

- Squat
- Push-up
- Lunge
- Plank
- Shoulder press
- Bicep curl
- Jumping jack
- Cat-cow
- Hip hinge

## Hybrid form scoring design

For each exercise the engine computes:

- Primary side selection from landmark visibility
- Joint angles such as knee, elbow, hip, and torso line
- Movement phase
- Rep transitions
- Confidence from visibility scores
- Rule-based baseline score and correction messages
- Optional model-backed classification from `public/models/pose-form-model.v1.json`
- Blended score when the local classifier is available
- Correction messages with severity

The current shipped classifier is a browser-side baseline over engineered pose features. It is designed as a drop-in asset so the project can later swap in real learned weights from labeled exercise datasets without changing the live-coach UI or hook API.

## Feedback policy

- Text feedback updates instantly
- Speech output is throttled
- Duplicate non-critical messages are suppressed
- Critical corrections can pre-empt normal cadence

## Current browser-side limitations

- Model assets are loaded from hosted MediaPipe resources
- The shipped form classifier is only a baseline configuration; production-grade correctness still benefits from a labeled dataset and retrained weights
- Tracking quality depends heavily on lighting, framing, and camera placement
- The current implementation uses main-thread inference throttled by requestAnimationFrame for simplicity; a worker-based variant can be added later if deeper performance tuning is required
