import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'robots.txt', 'icon-*.png'],
      manifest: {
        name: 'Giartech - Sistema de OS Integrado',
        short_name: 'Giartech',
        description: 'Sistema de gerenciamento de ordens de serviço',
        theme_color: '#0f567d',
        background_color: '#0f1623',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/login',
        scope: '/',
        lang: 'pt-BR',
        shortcuts: [
          {
            name: 'Minhas Ordens',
            short_name: 'Ordens',
            description: 'Ver ordens de serviço',
            url: '/mobile/orders',
            icons: [{ src: '/icon.png', sizes: '96x96' }]
          },
          {
            name: 'Agenda',
            short_name: 'Agenda',
            description: 'Ver agenda do dia',
            url: '/mobile/agenda',
            icons: [{ src: '/icon.png', sizes: '96x96' }]
          }
        ],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  }
});
