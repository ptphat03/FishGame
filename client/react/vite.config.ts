import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // WebSocket đến arena (game-server)
      '/api/v1/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
      // REST API đến hub
      '/api': {
        target: 'http://localhost:5100',
        changeOrigin: true,
      },
    },
  },
})
