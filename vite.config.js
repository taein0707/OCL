import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // capacitor:// 환경에서 /assets/... 절대경로가 깨질 수 있어 상대경로로 빌드
  base: './',
  plugins: [react()],
  build: {
    sourcemap: false,
    target: 'es2018',
  },
})
