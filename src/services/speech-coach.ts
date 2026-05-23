import type { Severity } from '@/types/models'

interface SpeechSettings {
  enabled: boolean
  rate: number
  pitch: number
  minIntervalMs: number
  selectedVoice?: string
}

class SpeechCoachService {
  private lastSpokenAt = 0
  private lastMessage = ''

  getVoices() {
    if (!('speechSynthesis' in window)) return []
    return window.speechSynthesis.getVoices()
  }

  speak(message: string, severity: Severity, settings: SpeechSettings) {
    if (!settings.enabled || !('speechSynthesis' in window) || !message) return
    const now = Date.now()
    const isCritical = severity === 'critical'
    if (!isCritical && message === this.lastMessage) return
    if (!isCritical && now - this.lastSpokenAt < settings.minIntervalMs) return

    const utterance = new SpeechSynthesisUtterance(message)
    const voice = this.getVoices().find((item) => item.name === settings.selectedVoice)
    if (voice) utterance.voice = voice
    utterance.rate = settings.rate
    utterance.pitch = settings.pitch
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    this.lastSpokenAt = now
    this.lastMessage = message
  }
}

export const SpeechCoach = new SpeechCoachService()
