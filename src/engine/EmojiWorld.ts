import Matter, { type Body } from 'matter-js'
import { EMOJI_BY_ID, pickRandomEmoji } from '../data/emojis'
import type { EmojiDefinition, ReactionDefinition, WorldSettings, WorldStats } from '../types'
import { PixelAudio } from './audio'
import { findReaction } from './reactions'

type EmojiBody = Body & {
  plugin: {
    emoji?: EmojiDefinition
    lastReactionAt?: number
  }
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
}

export class EmojiWorld {
  private engine = Matter.Engine.create({ enableSleeping: true })
  private runner = Matter.Runner.create()
  private renderFrame = 0
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private mouseConstraint?: Matter.MouseConstraint
  private walls: Body[] = []
  private particles: Particle[] = []
  private textures = new Map<string, HTMLCanvasElement>()
  private audio = new PixelAudio()
  private width = 1
  private height = 1
  private dpr = 1
  private lastFrame = performance.now()
  private fpsSamples: number[] = []
  private comboTimer?: number
  private lastCollisionAt = 0
  private discovered = new Set<string>()
  private shake = 0
  private destroyed = false

  private stats: WorldStats = {
    collisions: 0,
    combo: 0,
    maxCombo: 0,
    discovered: 0,
    fps: 60,
  }

  constructor(
    canvas: HTMLCanvasElement,
    private settings: WorldSettings,
    private onStats: (stats: WorldStats) => void,
    private onReaction: (reaction: ReactionDefinition) => void,
  ) {
    this.canvas = canvas
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) throw new Error('Canvas 2D context is unavailable')
    this.context = context
    this.engine.gravity.y = settings.gravity
    this.restoreDiscoveries()
    this.installEvents()
    this.resize()
    Matter.Runner.run(this.runner, this.engine)
    this.renderFrame = requestAnimationFrame(this.render)
  }

  start(initialCount = 24): void {
    for (let index = 0; index < initialCount; index += 1) {
      window.setTimeout(() => this.spawnRandom(undefined, -80 - Math.random() * 300), index * 70)
    }
  }

  updateSettings(settings: WorldSettings): void {
    this.settings = settings
    this.engine.gravity.y = settings.gravity
    this.audio.setEnabled(settings.soundEnabled)
    for (const body of Matter.Composite.allBodies(this.engine.world)) {
      const emoji = (body as EmojiBody).plugin.emoji
      if (emoji) body.restitution = Math.min(0.98, emoji.restitution * settings.restitution)
    }
  }

  spawnRandom(x?: number, y?: number): void {
    this.spawn(pickRandomEmoji(), x ?? 70 + Math.random() * Math.max(100, this.width - 140), y ?? -60)
  }

  spawnById(id: string, x?: number, y?: number): void {
    const emoji = EMOJI_BY_ID.get(id)
    if (emoji) this.spawn(emoji, x ?? this.width / 2, y ?? 90)
  }

  rain(count = 18): void {
    const safeCount = this.settings.lowMotion ? Math.min(count, 10) : count
    for (let index = 0; index < safeCount; index += 1) {
      window.setTimeout(() => this.spawnRandom(undefined, -80 - Math.random() * 180), index * 55)
    }
  }

  clear(): void {
    const bodies = Matter.Composite.allBodies(this.engine.world).filter((body) => (body as EmojiBody).plugin.emoji)
    for (const body of bodies) Matter.Composite.remove(this.engine.world, body)
    this.particles = []
    this.stats.combo = 0
    this.emitStats()
  }

  toggleGravity(enabled: boolean): void {
    this.engine.gravity.y = enabled ? this.settings.gravity : 0
  }

  shockwave(x = this.width / 2, y = this.height / 2, power = 0.045): void {
    const bodies = Matter.Composite.allBodies(this.engine.world)
    for (const body of bodies) {
      if (!(body as EmojiBody).plugin.emoji) continue
      const dx = body.position.x - x
      const dy = body.position.y - y
      const distance = Math.max(60, Math.hypot(dx, dy))
      if (distance > 520) continue
      const force = (1 - Math.min(1, distance / 520)) * power * body.mass
      Matter.Body.applyForce(body, body.position, { x: (dx / distance) * force, y: (dy / distance) * force })
    }
    this.burst(x, y, 28, 46)
    this.audio.explosion(this.settings.soundEnabled)
    this.shake = this.settings.shakeEnabled ? 12 : 0
  }

  destroy(): void {
    this.destroyed = true
    cancelAnimationFrame(this.renderFrame)
    window.removeEventListener('resize', this.resize)
    Matter.Runner.stop(this.runner)
    Matter.World.clear(this.engine.world, false)
    Matter.Engine.clear(this.engine)
  }

  private installEvents(): void {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) this.handleCollision(pair.bodyA as EmojiBody, pair.bodyB as EmojiBody)
    })

    const mouse = Matter.Mouse.create(this.canvas)
    mouse.pixelRatio = this.dpr
    this.mouseConstraint = Matter.MouseConstraint.create(this.engine, {
      mouse,
      constraint: { stiffness: 0.18, damping: 0.09, render: { visible: false } },
    })
    Matter.Composite.add(this.engine.world, this.mouseConstraint)
    this.canvas.addEventListener('pointerdown', () => this.audio.unlock(), { passive: true })
    this.canvas.addEventListener('dblclick', (event) => {
      const rect = this.canvas.getBoundingClientRect()
      this.shockwave(event.clientX - rect.left, event.clientY - rect.top)
    })
    window.addEventListener('resize', this.resize)
  }

  private handleCollision(a: EmojiBody, b: EmojiBody): void {
    const emojiA = a.plugin.emoji
    const emojiB = b.plugin.emoji
    if (!emojiA || !emojiB) return

    const relativeX = a.velocity.x - b.velocity.x
    const relativeY = a.velocity.y - b.velocity.y
    const impact = Math.hypot(relativeX, relativeY)
    if (impact < 0.65) return

    const now = performance.now()
    this.stats.collisions += 1
    this.stats.combo = now - this.lastCollisionAt < 780 ? this.stats.combo + 1 : 1
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo)
    this.lastCollisionAt = now
    window.clearTimeout(this.comboTimer)
    this.comboTimer = window.setTimeout(() => {
      this.stats.combo = 0
      this.emitStats()
    }, 1050)

    const point = {
      x: (a.position.x + b.position.x) / 2,
      y: (a.position.y + b.position.y) / 2,
    }
    this.burst(point.x, point.y, Math.min(12, 3 + Math.floor(impact)), 22 + impact * 3)
    this.audio.hit(impact, this.settings.soundEnabled)
    if (impact > 5.5 && this.settings.shakeEnabled) this.shake = Math.min(8, impact)

    const lastReaction = Math.max(a.plugin.lastReactionAt ?? 0, b.plugin.lastReactionAt ?? 0)
    if (now - lastReaction > 900) {
      const reaction = findReaction(emojiA.id, emojiB.id, impact)
      if (reaction) {
        a.plugin.lastReactionAt = now
        b.plugin.lastReactionAt = now
        this.triggerReaction(reaction, a, b, point.x, point.y)
      }
    }
    this.emitStats()
  }

  private triggerReaction(reaction: ReactionDefinition, a: EmojiBody, b: EmojiBody, x: number, y: number): void {
    if (!this.discovered.has(reaction.label)) {
      this.discovered.add(reaction.label)
      localStorage.setItem('emoji-collision:discoveries', JSON.stringify([...this.discovered]))
    }
    this.stats.discovered = this.discovered.size
    this.audio.reaction(this.settings.soundEnabled)
    this.onReaction(reaction)

    const particleCount = this.settings.lowMotion ? 16 : reaction.effect === 'explosion' ? 58 : 34
    this.burst(x, y, particleCount, reaction.effect === 'explosion' ? 90 : 54, reaction.effect === 'rainbow')
    if (reaction.effect === 'explosion') this.shockwave(x, y, 0.07)

    Matter.Composite.remove(this.engine.world, a)
    Matter.Composite.remove(this.engine.world, b)
    if (reaction.result) {
      window.setTimeout(() => {
        this.spawnById(reaction.result!, x, y)
      }, this.settings.lowMotion ? 80 : 240)
    }
  }

  private spawn(definition: EmojiDefinition, x: number, y: number): void {
    const currentCount = Matter.Composite.allBodies(this.engine.world).filter((body) => (body as EmojiBody).plugin.emoji).length
    const maxCount = this.settings.lowMotion ? 80 : 160
    if (currentCount >= maxCount) {
      const oldest = Matter.Composite.allBodies(this.engine.world).find((body) => (body as EmojiBody).plugin.emoji && !body.isSleeping)
      if (oldest) Matter.Composite.remove(this.engine.world, oldest)
    }

    const body = Matter.Bodies.circle(x, y, definition.radius, {
      label: `emoji:${definition.id}`,
      restitution: Math.min(0.98, definition.restitution * this.settings.restitution),
      friction: 0.08,
      frictionAir: 0.004,
      density: 0.0017 * definition.mass,
      sleepThreshold: 90,
    }) as EmojiBody
    body.plugin = { emoji: definition }
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.16)
    Matter.Composite.add(this.engine.world, body)
  }

  private resize = (): void => {
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.width = Math.max(320, rect.width)
    this.height = Math.max(420, rect.height)
    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    if (this.mouseConstraint) this.mouseConstraint.mouse.pixelRatio = this.dpr
    for (const wall of this.walls) Matter.Composite.remove(this.engine.world, wall)
    const thickness = 120
    this.walls = [
      Matter.Bodies.rectangle(this.width / 2, this.height + thickness / 2 - 12, this.width + thickness * 2, thickness, { isStatic: true }),
      Matter.Bodies.rectangle(-thickness / 2, this.height / 2, thickness, this.height * 2, { isStatic: true }),
      Matter.Bodies.rectangle(this.width + thickness / 2, this.height / 2, thickness, this.height * 2, { isStatic: true }),
      Matter.Bodies.rectangle(this.width / 2, -thickness - 240, this.width * 2, thickness, { isStatic: true }),
    ]
    Matter.Composite.add(this.engine.world, this.walls)
  }

  private render = (now: number): void => {
    if (this.destroyed) return
    const delta = Math.min(40, now - this.lastFrame)
    this.lastFrame = now
    const fps = 1000 / Math.max(1, delta)
    this.fpsSamples.push(fps)
    if (this.fpsSamples.length > 24) this.fpsSamples.shift()
    this.stats.fps = Math.round(this.fpsSamples.reduce((sum, sample) => sum + sample, 0) / this.fpsSamples.length)

    this.context.clearRect(0, 0, this.width, this.height)
    this.context.save()
    if (this.shake > 0.2) {
      this.context.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake)
      this.shake *= 0.84
    }

    for (const body of Matter.Composite.allBodies(this.engine.world)) {
      const emoji = (body as EmojiBody).plugin.emoji
      if (!emoji) continue
      this.drawEmoji(body, emoji)
    }
    this.drawParticles(delta)
    this.context.restore()

    if (Math.floor(now / 500) !== Math.floor((now - delta) / 500)) this.emitStats()
    this.renderFrame = requestAnimationFrame(this.render)
  }

  private drawEmoji(body: Body, emoji: EmojiDefinition): void {
    const texture = this.getTexture(emoji)
    const size = emoji.radius * 2.2
    const speed = Math.hypot(body.velocity.x, body.velocity.y)
    const squash = Math.min(0.14, speed * 0.012)
    this.context.save()
    this.context.translate(Math.round(body.position.x), Math.round(body.position.y))
    this.context.rotate(body.angle)
    this.context.scale(1 + squash, 1 - squash * 0.7)
    this.context.globalAlpha = body.isSleeping ? 0.9 : 1
    this.context.imageSmoothingEnabled = false
    this.context.drawImage(texture, -size / 2, -size / 2, size, size)
    this.context.restore()
  }

  private getTexture(emoji: EmojiDefinition): HTMLCanvasElement {
    const cached = this.textures.get(emoji.id)
    if (cached) return cached
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext('2d')!
    context.imageSmoothingEnabled = false
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = '25px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
    context.shadowColor = 'rgba(0, 0, 0, 0.92)'
    context.shadowBlur = 0
    context.shadowOffsetX = 1.5
    context.shadowOffsetY = 2
    context.fillText(emoji.glyph, 16, 16)
    this.textures.set(emoji.id, canvas)
    return canvas
  }

  private burst(x: number, y: number, count: number, speed: number, rainbow = false): void {
    const safeCount = this.settings.lowMotion ? Math.ceil(count * 0.55) : count
    for (let index = 0; index < safeCount; index += 1) {
      const angle = Math.random() * Math.PI * 2
      const velocity = (0.25 + Math.random() * 0.75) * speed * 0.03
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - Math.random() * 1.8,
        life: 430 + Math.random() * 450,
        maxLife: 880,
        size: 2 + Math.floor(Math.random() * 5),
        hue: rainbow ? Math.random() * 360 : 42 + Math.random() * 35,
      })
    }
    if (this.particles.length > 900) this.particles.splice(0, this.particles.length - 900)
  }

  private drawParticles(delta: number): void {
    this.context.save()
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index]
      if (!particle) continue
      particle.life -= delta
      if (particle.life <= 0) {
        this.particles.splice(index, 1)
        continue
      }
      particle.x += particle.vx * delta
      particle.y += particle.vy * delta
      particle.vy += 0.0009 * delta
      const alpha = Math.min(1, particle.life / (particle.maxLife * 0.42))
      this.context.globalAlpha = alpha
      this.context.fillStyle = `hsl(${particle.hue} 92% 64%)`
      this.context.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size)
    }
    this.context.restore()
  }

  private restoreDiscoveries(): void {
    try {
      const values = JSON.parse(localStorage.getItem('emoji-collision:discoveries') ?? '[]') as string[]
      this.discovered = new Set(values)
      this.stats.discovered = this.discovered.size
    } catch {
      this.discovered = new Set()
    }
  }

  private emitStats(): void {
    this.onStats({ ...this.stats })
  }
}
