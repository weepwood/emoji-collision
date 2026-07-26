<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import PixelIcon from './components/PixelIcon.vue'
import { EMOJIS } from './data/emojis'
import { EmojiWorld } from './engine/EmojiWorld'
import { REACTIONS } from './engine/reactions'
import type { EmojiCategory, ReactionDefinition, WorldSettings, WorldStats } from './types'

const canvas = ref<HTMLCanvasElement>()
const world = ref<EmojiWorld>()
const showIntro = ref(true)
const showSettings = ref(false)
const showAbout = ref(false)
const gravityEnabled = ref(true)
const activeReaction = ref<ReactionDefinition>()
const reactionTimer = ref<number>()
const activeCategory = ref<'all' | EmojiCategory>('all')

const stats = reactive<WorldStats>({ collisions: 0, combo: 0, maxCombo: 0, discovered: 0, fps: 60 })
const settings = reactive<WorldSettings>({
  gravity: 0.95,
  restitution: 1,
  soundEnabled: true,
  shakeEnabled: true,
  lowMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
})

const categoryOptions: ReadonlyArray<{ id: 'all' | EmojiCategory; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'face', label: '表情' },
  { id: 'nature', label: '自然' },
  { id: 'object', label: '物件' },
  { id: 'food', label: '食物' },
  { id: 'space', label: '太空' },
  { id: 'special', label: '特殊' },
]

const discoveredPercent = computed(() => Math.round((stats.discovered / REACTIONS.length) * 100))
const filteredEmojis = computed(() => activeCategory.value === 'all'
  ? EMOJIS
  : EMOJIS.filter((emoji) => emoji.category === activeCategory.value))
const labState = computed(() => stats.fps >= 48 ? '稳定' : stats.fps >= 30 ? '繁忙' : '降载')
const nextHint = computed(() => {
  if (stats.discovered === 0) return '实验提示：试试让火焰撞上水滴。'
  if (stats.discovered < 3) return '继续探索：猫可能对纸箱很感兴趣。'
  if (stats.discovered < REACTIONS.length) return '反应仍未收集完整，留意太空与情绪组合。'
  return '全部反应已发现，继续挑战更高连击。'
})

function loadSettings(): void {
  try {
    const stored = JSON.parse(localStorage.getItem('emoji-collision:settings') ?? '{}') as Partial<WorldSettings>
    Object.assign(settings, stored)
  } catch {
    // Ignore damaged settings and keep safe defaults.
  }
}

function saveSettings(): void {
  localStorage.setItem('emoji-collision:settings', JSON.stringify(settings))
}

function handleStats(nextStats: WorldStats): void {
  Object.assign(stats, nextStats)
}

function handleReaction(reaction: ReactionDefinition): void {
  activeReaction.value = reaction
  window.clearTimeout(reactionTimer.value)
  reactionTimer.value = window.setTimeout(() => {
    activeReaction.value = undefined
  }, 2200)
}

function spawnEmoji(id?: string): void {
  if (id) world.value?.spawnById(id)
  else world.value?.spawnRandom()
}

function toggleGravity(): void {
  gravityEnabled.value = !gravityEnabled.value
  world.value?.toggleGravity(gravityEnabled.value)
}

function toggleSound(): void {
  settings.soundEnabled = !settings.soundEnabled
}

function closeLayers(): void {
  showSettings.value = false
  showAbout.value = false
}

function handleShortcut(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  if (target?.matches('input, textarea, select, button')) return

  if (event.key === 'Escape') {
    closeLayers()
    showIntro.value = false
    return
  }

  if (showSettings.value || showAbout.value || showIntro.value) return

  switch (event.key.toLowerCase()) {
    case ' ':
      event.preventDefault()
      spawnEmoji()
      break
    case 'r':
      world.value?.rain()
      break
    case 'g':
      toggleGravity()
      break
    case 'b':
      world.value?.shockwave()
      break
    case 'c':
      world.value?.clear()
      break
    case 's':
      showSettings.value = true
      break
  }
}

watch(settings, () => {
  saveSettings()
  world.value?.updateSettings({ ...settings })
}, { deep: true })

onMounted(async () => {
  loadSettings()
  await nextTick()
  if (!canvas.value) return
  world.value = new EmojiWorld(canvas.value, { ...settings }, handleStats, handleReaction)
  world.value.start(settings.lowMotion ? 14 : 25)
  window.addEventListener('keydown', handleShortcut)
  window.setTimeout(() => {
    showIntro.value = false
  }, settings.lowMotion ? 1200 : 4200)
})

onBeforeUnmount(() => {
  window.clearTimeout(reactionTimer.value)
  window.removeEventListener('keydown', handleShortcut)
  world.value?.destroy()
})
</script>

<template>
  <main class="app-shell">
    <canvas ref="canvas" class="world-canvas" aria-label="可交互的 Emoji 碰撞区域" />
    <div class="ambient-glow" aria-hidden="true" />
    <div class="pixel-grid" aria-hidden="true" />
    <div class="scanlines" aria-hidden="true" />

    <header class="topbar">
      <a class="brand" href="https://github.com/weepwood/emoji-collision" target="_blank" rel="noreferrer">
        <span class="brand-mark" aria-hidden="true"><b>EC</b><i /></span>
        <span class="brand-copy">
          <strong>EMOJI COLLISION</strong>
          <small>INTERACTIVE PIXEL LAB / 01</small>
        </span>
      </a>

      <div class="lab-status" aria-label="实验室运行状态">
        <span class="status-light" />
        <span><b>LAB ONLINE</b><small>{{ labState }} · {{ gravityEnabled ? '重力启用' : '零重力' }}</small></span>
      </div>

      <div class="top-actions">
        <button class="header-action" type="button" :aria-label="settings.soundEnabled ? '关闭声音' : '开启声音'" @click="toggleSound">
          <PixelIcon :name="settings.soundEnabled ? 'sound' : 'mute'" />
          <span>{{ settings.soundEnabled ? '声音' : '静音' }}</span>
        </button>
        <button class="header-action" type="button" aria-label="打开设置" @click="showSettings = true">
          <PixelIcon name="settings" />
          <span>设置</span>
        </button>
        <button class="icon-button" type="button" aria-label="关于项目" @click="showAbout = true">
          <PixelIcon name="info" />
        </button>
      </div>
    </header>

    <section class="telemetry-panel" aria-live="polite">
      <div class="telemetry-head">
        <span><i /> LIVE TELEMETRY</span>
        <b>{{ stats.fps }} FPS</b>
      </div>
      <div class="telemetry-grid">
        <div><span>COLLISIONS</span><strong>{{ stats.collisions.toLocaleString() }}</strong><small>累计碰撞</small></div>
        <div><span>MAX COMBO</span><strong>{{ stats.maxCombo }}</strong><small>最高连击</small></div>
        <div><span>DISCOVERED</span><strong>{{ stats.discovered }}/{{ REACTIONS.length }}</strong><small>反应图鉴</small></div>
      </div>
    </section>

    <aside class="field-note" aria-live="polite">
      <span>FIELD NOTE</span>
      <p>{{ nextHint }}</p>
      <small>拖拽投掷 · 双击场景触发冲击波</small>
    </aside>

    <Transition name="combo">
      <div v-if="stats.combo >= 3" :key="stats.combo" class="combo-counter">
        <span>CHAIN REACTION</span>
        <strong>{{ stats.combo }}</strong>
        <b>{{ stats.combo >= 20 ? 'MEGA COMBO' : stats.combo >= 10 ? 'SUPER COMBO' : 'COMBO' }}</b>
      </div>
    </Transition>

    <Transition name="reaction">
      <div v-if="activeReaction" class="reaction-toast">
        <span>REACTION UNLOCKED</span>
        <strong>{{ activeReaction.label }}</strong>
        <small>已写入本地实验记录</small>
      </div>
    </Transition>

    <Transition name="intro">
      <div v-if="showIntro" class="intro-layer" @click.self="showIntro = false">
        <section class="intro-card">
          <div class="intro-eyebrow"><i /> INTERACTIVE EXPERIMENT 01</div>
          <h1>把情绪<br /><span>扔进碰撞场。</span></h1>
          <p>抓住任意 Emoji，投向另一个表情。制造连击，解锁隐藏反应，让这个像素实验室逐渐失控。</p>
          <button class="intro-cta" type="button" @click="showIntro = false">
            <span>进入实验场</span>
            <b>ENTER</b>
          </button>
          <div class="intro-controls">
            <span><kbd>拖拽</kbd> 投掷</span>
            <span><kbd>双击</kbd> 爆破</span>
            <span><kbd>Space</kbd> 投放</span>
          </div>
          <i class="corner corner-a" /><i class="corner corner-b" />
        </section>
      </div>
    </Transition>

    <nav class="tool-dock" aria-label="碰撞控制台">
      <div class="dock-group">
        <button type="button" class="dock-button primary" @click="spawnEmoji()">
          <span class="dock-icon"><PixelIcon name="plus" /></span>
          <span class="dock-copy"><b>投放 Emoji</b><small>随机单位</small></span>
          <kbd>SPACE</kbd>
        </button>
        <button type="button" class="dock-button compact" @click="world?.rain()">
          <span class="dock-icon"><PixelIcon name="rain" /></span>
          <span class="dock-copy"><b>表情雨</b><small>批量投放</small></span>
          <kbd>R</kbd>
        </button>
      </div>
      <span class="dock-divider" />
      <div class="dock-group dock-group-actions">
        <button type="button" class="dock-button square" :class="{ active: gravityEnabled }" :aria-pressed="gravityEnabled" @click="toggleGravity">
          <span class="dock-icon"><PixelIcon name="gravity" /></span><span>重力</span><kbd>G</kbd>
        </button>
        <button type="button" class="dock-button square accent" @click="world?.shockwave()">
          <span class="dock-icon"><PixelIcon name="blast" /></span><span>冲击</span><kbd>B</kbd>
        </button>
        <button type="button" class="dock-button square danger" @click="world?.clear()">
          <span class="dock-icon"><PixelIcon name="trash" /></span><span>清场</span><kbd>C</kbd>
        </button>
      </div>
    </nav>

    <Transition name="panel">
      <div v-if="showSettings" class="panel-backdrop" @click.self="showSettings = false">
        <aside class="side-panel" aria-label="实验设置">
          <div class="panel-header">
            <div><small>LAB CONTROL / SETTINGS</small><h2>实验控制台</h2><p>调整物理参数与反馈强度。</p></div>
            <button type="button" class="icon-button" aria-label="关闭设置" @click="showSettings = false"><PixelIcon name="close" /></button>
          </div>

          <section class="panel-section">
            <div class="section-heading"><span>01</span><div><b>物理参数</b><small>PHYSICS ENGINE</small></div></div>
            <label class="range-card">
              <span><b>重力强度</b><output>{{ settings.gravity.toFixed(2) }}</output></span>
              <input v-model.number="settings.gravity" type="range" min="0.15" max="1.8" step="0.05" />
              <small><i>漂浮</i><i>标准</i><i>坠落</i></small>
            </label>
            <label class="range-card">
              <span><b>弹性系数</b><output>{{ settings.restitution.toFixed(2) }}</output></span>
              <input v-model.number="settings.restitution" type="range" min="0.35" max="1.25" step="0.05" />
              <small><i>沉重</i><i>平衡</i><i>弹跳</i></small>
            </label>
          </section>

          <section class="panel-section">
            <div class="section-heading"><span>02</span><div><b>反馈系统</b><small>FEEDBACK SYSTEM</small></div></div>
            <div class="switch-stack">
              <label class="switch-row"><span><b>碰撞声音</b><small>程序生成的 8-bit 音效</small></span><input v-model="settings.soundEnabled" type="checkbox" /></label>
              <label class="switch-row"><span><b>屏幕震动</b><small>强化高速碰撞与爆破反馈</small></span><input v-model="settings.shakeEnabled" type="checkbox" /></label>
              <label class="switch-row"><span><b>低动态模式</b><small>降低粒子数量和场景负载</small></span><input v-model="settings.lowMotion" type="checkbox" /></label>
            </div>
          </section>

          <section class="panel-section emoji-picker">
            <div class="section-heading"><span>03</span><div><b>单位投放库</b><small>{{ EMOJIS.length }} UNITS AVAILABLE</small></div></div>
            <div class="category-tabs" role="tablist" aria-label="Emoji 分类">
              <button v-for="category in categoryOptions" :key="category.id" type="button" :class="{ active: activeCategory === category.id }" @click="activeCategory = category.id">{{ category.label }}</button>
            </div>
            <div class="emoji-grid">
              <button v-for="emoji in filteredEmojis" :key="emoji.id" type="button" :title="emoji.label" @click="spawnEmoji(emoji.id)">
                <span>{{ emoji.glyph }}</span><small>{{ emoji.label }}</small>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showAbout" class="modal-backdrop" @click.self="showAbout = false">
        <section class="about-card">
          <button class="icon-button close-button" type="button" aria-label="关闭关于窗口" @click="showAbout = false"><PixelIcon name="close" /></button>
          <div class="about-label"><i /> EMOJI COLLISION LAB / 01</div>
          <h2>一个会发生化学反应的<br /><span>像素情绪沙盒。</span></h2>
          <p>拖拽、投掷、碰撞。不同 Emoji 在足够强烈的接触下会触发隐藏反应，所有发现都会保存在当前浏览器中。</p>

          <div class="discovery-card">
            <div><span>DISCOVERY PROGRESS</span><strong>{{ discoveredPercent }}%</strong></div>
            <div class="discovery-bar"><i :style="{ width: `${discoveredPercent}%` }" /></div>
            <small>{{ stats.discovered }} / {{ REACTIONS.length }} 个反应已收集</small>
          </div>

          <div class="about-features">
            <div><b>PHYSICS</b><span>真实碰撞与堆积</span></div>
            <div><b>REACTIONS</b><span>隐藏组合系统</span></div>
            <div><b>LOCAL</b><span>无账号本地记录</span></div>
          </div>

          <div class="about-footer">
            <p>线索：火需要水，猫喜欢纸箱，火箭正在寻找月亮。</p>
            <a href="https://github.com/weepwood/emoji-collision" target="_blank" rel="noreferrer">VIEW SOURCE ↗</a>
          </div>
        </section>
      </div>
    </Transition>
  </main>
</template>
