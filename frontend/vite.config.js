import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'n8n Flow Manager',
        short_name: 'n8n App',
        description: 'Interactive workflow manager frontend for n8n',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
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
