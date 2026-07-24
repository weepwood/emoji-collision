import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/emoji-collision/',
  build: {
    target: 'es2020',
    sourcemap: true,
  },
})
