import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const target = env.N8N_URL || 'https://n8n.workflowsolution.org';
  const apiKey = env.N8N_API_KEY || env.VITE_N8N_API_KEY;

  return {
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
        target,
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (apiKey) proxyReq.setHeader('X-N8N-API-KEY', apiKey);
          });
        },
      },
      '/healthz': {
        target,
        changeOrigin: true,
      },
      '/webhook': {
        target,
        changeOrigin: true,
      },
      '/webhook-test': {
        target,
        changeOrigin: true,
      }
    }
  }
  };
})
