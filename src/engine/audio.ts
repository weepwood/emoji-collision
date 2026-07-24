export class PixelAudio {
  private context?: AudioContext
  private lastAt = 0

  setEnabled(enabled: boolean): void {
    if (!enabled && this.context?.state === 'running') void this.context.suspend()
    if (enabled && this.context?.state === 'suspended') void this.context.resume()
  }

  unlock(): void {
    this.context ??= new AudioContext()
    if (this.context.state === 'suspended') void this.context.resume()
  }

  hit(intensity: number, enabled: boolean): void {
    if (!enabled) return
    const now = performance.now()
    if (now - this.lastAt < 42) return
    this.lastAt = now
    this.tone(110 + Math.min(360, intensity * 55), 0.035, 'square', Math.min(0.045, 0.012 + intensity * 0.005))
  }

  reaction(enabled: boolean): void {
    if (!enabled) return
    ;[360, 520, 720].forEach((frequency, index) => {
      window.setTimeout(() => this.tone(frequency, 0.08, 'square', 0.035), index * 45)
    })
  }

  explosion(enabled: boolean): void {
    if (!enabled) return
    this.tone(85, 0.18, 'sawtooth', 0.06)
  }

  private tone(frequency: number, duration: number, type: OscillatorType, volume: number): void {
    this.unlock()
    if (!this.context) return
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration)
    oscillator.connect(gain).connect(this.context.destination)
    oscillator.start()
    oscillator.stop(this.context.currentTime + duration)
  }
}
