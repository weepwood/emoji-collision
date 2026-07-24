import type { EmojiDefinition } from '../types'

export const EMOJIS: readonly EmojiDefinition[] = [
  { id: 'grin', glyph: '😀', label: '开心', category: 'face', radius: 30, mass: 1.0, restitution: 0.78, rarity: 1 },
  { id: 'laugh', glyph: '😂', label: '笑哭', category: 'face', radius: 31, mass: 1.0, restitution: 0.85, rarity: 1 },
  { id: 'cool', glyph: '😎', label: '酷', category: 'face', radius: 31, mass: 1.1, restitution: 0.72, rarity: 1 },
  { id: 'cry', glyph: '😭', label: '大哭', category: 'face', radius: 31, mass: 1.0, restitution: 0.62, rarity: 1 },
  { id: 'angry', glyph: '😡', label: '生气', category: 'face', radius: 31, mass: 1.25, restitution: 0.55, rarity: 1 },
  { id: 'mindblown', glyph: '🤯', label: '脑洞爆炸', category: 'face', radius: 33, mass: 1.15, restitution: 0.8, rarity: 2 },
  { id: 'ghost', glyph: '👻', label: '幽灵', category: 'special', radius: 30, mass: 0.7, restitution: 0.9, rarity: 2 },
  { id: 'robot', glyph: '🤖', label: '机器人', category: 'object', radius: 31, mass: 1.5, restitution: 0.5, rarity: 2 },
  { id: 'cat', glyph: '🐱', label: '猫', category: 'nature', radius: 30, mass: 0.9, restitution: 0.78, rarity: 1 },
  { id: 'frog', glyph: '🐸', label: '青蛙', category: 'nature', radius: 30, mass: 1.0, restitution: 0.88, rarity: 1 },
  { id: 'fire', glyph: '🔥', label: '火焰', category: 'nature', radius: 28, mass: 0.75, restitution: 0.84, rarity: 1 },
  { id: 'water', glyph: '💧', label: '水滴', category: 'nature', radius: 26, mass: 0.72, restitution: 0.68, rarity: 1 },
  { id: 'rain', glyph: '🌧️', label: '雨云', category: 'nature', radius: 32, mass: 1.15, restitution: 0.45, rarity: 2 },
  { id: 'rainbow', glyph: '🌈', label: '彩虹', category: 'nature', radius: 34, mass: 0.9, restitution: 0.68, rarity: 2 },
  { id: 'heart', glyph: '❤️', label: '爱心', category: 'special', radius: 27, mass: 0.82, restitution: 0.75, rarity: 1 },
  { id: 'broken-heart', glyph: '💔', label: '心碎', category: 'special', radius: 27, mass: 0.82, restitution: 0.72, rarity: 2 },
  { id: 'bomb', glyph: '💣', label: '炸弹', category: 'object', radius: 28, mass: 1.7, restitution: 0.42, rarity: 2 },
  { id: 'box', glyph: '📦', label: '纸箱', category: 'object', radius: 31, mass: 1.85, restitution: 0.35, rarity: 1 },
  { id: 'burger', glyph: '🍔', label: '汉堡', category: 'food', radius: 30, mass: 1.4, restitution: 0.52, rarity: 1 },
  { id: 'rocket', glyph: '🚀', label: '火箭', category: 'space', radius: 30, mass: 1.05, restitution: 0.8, rarity: 2 },
  { id: 'moon', glyph: '🌕', label: '月亮', category: 'space', radius: 32, mass: 1.45, restitution: 0.58, rarity: 2 },
  { id: 'sparkles', glyph: '✨', label: '闪光', category: 'special', radius: 25, mass: 0.45, restitution: 0.95, rarity: 3 },
] as const

export const EMOJI_BY_ID = new Map(EMOJIS.map((emoji) => [emoji.id, emoji]))

export function pickRandomEmoji(): EmojiDefinition {
  const weighted = EMOJIS.flatMap((emoji) => Array(Math.max(1, 5 - emoji.rarity)).fill(emoji))
  return weighted[Math.floor(Math.random() * weighted.length)] ?? EMOJIS[0]
}
