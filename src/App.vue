<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import PixelIcon from './components/PixelIcon.vue'
import { EMOJIS } from './data/emojis'
import { EmojiWorld } from './engine/EmojiWorld'
import { REACTIONS } from './engine/reactions'
import type { ReactionDefinition, WorldSettings, WorldStats } from './types'

const canvas = ref<HTMLCanvasElement>()
const world = ref<EmojiWorld>()
const showIntro = ref(true)
const showSettings = ref(false)
const showAbout = ref(false)
const gravityEnabled = ref(true)
const activeReaction = ref<ReactionDefinition>()
const reactionTimer = ref<number>()

const stats = reactive<WorldStats>({ collisions: 0, combo: 0, maxCombo: 0, discovered: 0, fps: 60 })
const settings = reactive<WorldSettings>({
  gravity: 0.95,
  restitution: 1,
  soundEnabled: true,
  shakeEnabled: true,
  lowMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
})

const discoveredPercent = computed(() => Math.round((stats.discovered / REACTIONS.length) * 100))

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
  window.setTimeout(() => {
    showIntro.value = false
  }, settings.lowMotion ? 700 : 2300)
})

onBeforeUnmount(() => {
  window.clearTimeout(reactionTimer.value)
  world.value?.destroy()
})
</script>

<template>
  <main class="app-shell" @pointerdown.once="showIntro = false">
    <canvas ref="canvas" class="world-canvas" aria-label="可交互的 Emoji 碰撞区域" />
    <div class="pixel-grid" aria-hidden="true" />
    <div class="scanlines" aria-hidden="true" />

    <header class="topbar">
      <a class="brand" href="https://github.com/weepwood/emoji-collision" target="_blank" rel="noreferrer">
        <span class="brand-mark" aria-hidden="true">EC</span>
        <span>
          <strong>EMOJI COLLISION</strong>
          <small>PIXEL PHYSICS LAB</small>
        </span>
      </a>

      <div class="top-actions">
        <button class="icon-button" type="button" :aria-label="settings.soundEnabled ? '关闭声音' : '开启声音'" @click="toggleSound">
          <PixelIcon :name="settings.soundEnabled ? 'sound' : 'mute'" />
        </button>
        <button class="icon-button" type="button" aria-label="打开设置" @click="showSettings = true">
          <PixelIcon name="settings" />
        </button>
        <button class="icon-button" type="button" aria-label="关于项目" @click="showAbout = true">
          <PixelIcon name="info" />
        </button>
      </div>
    </header>

    <section class="stats-panel" aria-live="polite">
      <div><span>碰撞</span><strong>{{ stats.collisions.toLocaleString() }}</strong></div>
      <div><span>最高连击</span><strong>{{ stats.maxCombo }}</strong></div>
      <div><span>反应图鉴</span><strong>{{ stats.discovered }}/{{ REACTIONS.length }}</strong></div>
      <div class="fps"><span>FPS</span><strong>{{ stats.fps }}</strong></div>
    </section>

    <Transition name="combo">
      <div v-if="stats.combo >= 3" :key="stats.combo" class="combo-counter">
        <strong>{{ stats.combo }}</strong>
        <span>{{ stats.combo >= 20 ? 'MEGA COMBO' : stats.combo >= 10 ? 'SUPER COMBO' : 'COMBO' }}</span>
      </div>
    </Transition>

    <Transition name="reaction">
      <div v-if="activeReaction" class="reaction-toast">
        <span>NEW REACTION</span>
        <strong>{{ activeReaction.label }}</strong>
      </div>
    </Transition>

    <Transition name="intro">
      <section v-if="showIntro" class="intro-card" @click="showIntro = false">
        <p>THROW YOUR FEELINGS AROUND.</p>
        <h1>今天的情绪，<br />撞一下再说。</h1>
        <div class="intro-tip"><span>拖拽投掷</span><i /> <span>双击爆破</span><i /> <span>发现组合</span></div>
      </section>
    </Transition>

    <nav class="tool-dock" aria-label="碰撞控制台">
      <button type="button" @click="spawnEmoji()">
        <PixelIcon name="plus" />
        <span>添加</span>
      </button>
      <button type="button" @click="world?.rain()">
        <PixelIcon name="rain" />
        <span>Emoji 雨</span>
      </button>
      <button type="button" :class="{ active: gravityEnabled }" @click="toggleGravity">
        <PixelIcon name="gravity" />
        <span>重力</span>
      </button>
      <button type="button" class="accent" @click="world?.shockwave()">
        <PixelIcon name="blast" />
        <span>爆破</span>
      </button>
      <button type="button" @click="world?.clear()">
        <PixelIcon name="trash" />
        <span>清空</span>
      </button>
    </nav>

    <Transition name="panel">
      <aside v-if="showSettings" class="side-panel" aria-label="实验设置">
        <div class="panel-header">
          <div><small>CONTROL PANEL</small><h2>实验参数</h2></div>
          <button type="button" class="icon-button" aria-label="关闭设置" @click="showSettings = false"><PixelIcon name="close" /></button>
        </div>

        <label class="range-control">
          <span><b>重力强度</b><output>{{ settings.gravity.toFixed(2) }}</output></span>
          <input v-model.number="settings.gravity" type="range" min="0.15" max="1.8" step="0.05" />
        </label>
        <label class="range-control">
          <span><b>弹性系数</b><output>{{ settings.restitution.toFixed(2) }}</output></span>
          <input v-model.number="settings.restitution" type="range" min="0.35" max="1.25" step="0.05" />
        </label>

        <label class="switch-row"><span><b>碰撞声音</b><small>8-bit 合成音效</small></span><input v-model="settings.soundEnabled" type="checkbox" /></label>
        <label class="switch-row"><span><b>屏幕震动</b><small>强化高速撞击反馈</small></span><input v-model="settings.shakeEnabled" type="checkbox" /></label>
        <label class="switch-row"><span><b>低动态模式</b><small>减少粒子与场景数量</small></span><input v-model="settings.lowMotion" type="checkbox" /></label>

        <div class="emoji-picker">
          <div class="section-title"><b>投放指定 Emoji</b><span>{{ EMOJIS.length }} AVAILABLE</span></div>
          <div class="emoji-grid">
            <button v-for="emoji in EMOJIS" :key="emoji.id" type="button" :title="emoji.label" @click="spawnEmoji(emoji.id)">{{ emoji.glyph }}</button>
          </div>
        </div>
      </aside>
    </Transition>

    <Transition name="modal">
      <div v-if="showAbout" class="modal-backdrop" @click.self="showAbout = false">
        <section class="about-card">
          <button class="icon-button close-button" type="button" aria-label="关闭关于窗口" @click="showAbout = false"><PixelIcon name="close" /></button>
          <small>EMOJI COLLISION LAB / 01</small>
          <h2>一个会发生化学反应的<br />像素情绪沙盒。</h2>
          <p>抓住一个 Emoji，把它扔向另一个。不同组合在足够强烈的碰撞下会触发隐藏反应，发现记录会保存在你的浏览器中。</p>
          <div class="discovery-bar"><i :style="{ width: `${discoveredPercent}%` }" /></div>
          <div class="about-stats"><strong>{{ discoveredPercent }}%</strong><span>反应图鉴完成度</span></div>
          <p class="hint">线索：火需要水，猫喜欢纸箱，火箭正在寻找月亮。</p>
        </section>
      </div>
    </Transition>
  </main>
</template>
