import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../',
  server: {
    proxy: {
      '/api': {
        target: 'https://n8n.workflowsolution.org',
        changeOrigin: true,
        secure: true,
      },
      '/webhook': {
        target: 'https://n8n.workflowsolution.org',
        changeOrigin: true,
      },
      '/webhook-test': {
        target: 'https://n8n.workflowsolution.org',
        changeOrigin: true,
      }
    }
  }
})
