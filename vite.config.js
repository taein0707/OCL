import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 🔥 필수: 모바일 앱(Capacitor) 빌드 시 상대 경로 지정을 위해 반드시 필요합니다.
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})