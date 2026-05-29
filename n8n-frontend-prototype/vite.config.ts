import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');

  return {
    plugins: [
      react(),
      viteSingleFile(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'n8n Frontend Prototype',
          short_name: 'n8n Proto',
          description: 'Frontend prototype for n8n workflows',
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
          target: env.N8N_URL || 'http://localhost:5678',
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              // Inject API key from local environment (without exposing to client bundle)
              const apiKey = env.N8N_API_KEY || env.VITE_N8N_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('X-N8N-API-KEY', apiKey);
              }
            });
          }
        },
        '/healthz': {
          target: env.N8N_URL || 'http://localhost:5678',
          changeOrigin: true,
        },
        '/webhook': {
          target: env.N8N_URL || 'http://localhost:5678',
          changeOrigin: true,
        },
        '/webhook-test': {
          target: env.N8N_URL || 'http://localhost:5678',
          changeOrigin: true,
        },
      },
    },
  };
})
