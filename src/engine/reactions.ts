import type { ReactionDefinition } from '../types'

export const REACTIONS: readonly ReactionDefinition[] = [
  { pair: ['fire', 'water'], label: '蒸汽云', effect: 'steam', result: 'ghost', minimumSpeed: 2.1 },
  { pair: ['rain', 'rainbow'], label: '雨后彩虹', effect: 'rainbow', result: 'sparkles', minimumSpeed: 1.4 },
  { pair: ['cat', 'box'], label: '箱中猫', effect: 'box-cat', result: 'cat', minimumSpeed: 1.2 },
  { pair: ['heart', 'broken-heart'], label: '爱心碎片', effect: 'heartbreak', result: 'sparkles', minimumSpeed: 1.5 },
  { pair: ['angry', 'bomb'], label: '情绪爆炸', effect: 'explosion', result: 'mindblown', minimumSpeed: 1.7 },
  { pair: ['rocket', 'moon'], label: '登月成功', effect: 'moonshot', result: 'sparkles', minimumSpeed: 2.0 },
] as const

export function normalizePair(a: string, b: string): string {
  return [a, b].sort().join('::')
}

const reactionMap = new Map(REACTIONS.map((reaction) => [normalizePair(...reaction.pair), reaction]))

export function findReaction(a: string, b: string, impactSpeed: number): ReactionDefinition | undefined {
  const reaction = reactionMap.get(normalizePair(a, b))
  if (!reaction || impactSpeed < reaction.minimumSpeed) return undefined
  return reaction
}
