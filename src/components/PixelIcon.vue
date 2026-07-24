<script setup lang="ts">
defineProps<{ name: 'plus' | 'rain' | 'gravity' | 'blast' | 'trash' | 'sound' | 'mute' | 'settings' | 'info' | 'close' }>()
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true" class="pixel-icon">
    <template v-if="name === 'plus'">
      <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
    </template>
    <template v-else-if="name === 'rain'">
      <path d="M5 3h14v3h2v4H3V6h2zM5 13h3v3H5zm6 0h3v3h-3zm6 0h3v3h-3zM8 18h3v3H8zm6 0h3v3h-3z" />
    </template>
    <template v-else-if="name === 'gravity'">
      <path d="M10 3h4v10h4l-6 7-6-7h4z" />
    </template>
    <template v-else-if="name === 'blast'">
      <path d="M10 2h4v5l4-3 2 4-5 3 5 3-2 4-4-3v6h-4v-6l-4 3-2-4 5-3-5-3 2-4 4 3z" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M7 3h10v3h4v3H3V6h4zm-1 8h3v8H6zm5 0h3v8h-3zm5 0h3v8h-3z" />
    </template>
    <template v-else-if="name === 'sound'">
      <path d="M3 9h5l5-5v16l-5-5H3zm13-2h3v3h2v4h-2v3h-3v-3h2v-4h-2z" />
    </template>
    <template v-else-if="name === 'mute'">
      <path d="M3 9h5l5-5v16l-5-5H3zm13-1 2-2 3 3 3-3 2 2-3 3 3 3-2 2-3-3-3 3-2-2 3-3z" transform="scale(.8) translate(3 2)" />
    </template>
    <template v-else-if="name === 'settings'">
      <path d="M9 2h6v3h3v3h3v8h-3v3h-3v3H9v-3H6v-3H3V8h3V5h3zm3 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    </template>
    <template v-else-if="name === 'info'">
      <path d="M8 2h8v3h3v3h3v8h-3v3h-3v3H8v-3H5v-3H2V8h3V5h3zm2 5h4v4h-4zm0 6h4v5h-4z" />
    </template>
    <template v-else>
      <path d="m5 3 7 7 7-7 2 2-7 7 7 7-2 2-7-7-7 7-2-2 7-7-7-7z" />
    </template>
  </svg>
</template>
