export type EmojiCategory = 'face' | 'nature' | 'object' | 'food' | 'space' | 'special'

export interface EmojiDefinition {
  id: string
  glyph: string
  label: string
  category: EmojiCategory
  radius: number
  mass: number
  restitution: number
  rarity: number
}

export interface ReactionDefinition {
  pair: readonly [string, string]
  label: string
  effect: 'steam' | 'rainbow' | 'box-cat' | 'heartbreak' | 'explosion' | 'moonshot'
  result?: string
  minimumSpeed: number
}

export interface WorldStats {
  collisions: number
  combo: number
  maxCombo: number
  discovered: number
  fps: number
}

export interface WorldSettings {
  gravity: number
  restitution: number
  soundEnabled: boolean
  shakeEnabled: boolean
  lowMotion: boolean
}
