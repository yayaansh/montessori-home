import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*.ttf', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Montessori Home',
        short_name: 'Montessori',
        description: 'A Montessori Elementary album and digital materials for home.',
        theme_color: '#f6f1e8',
        background_color: '#f6f1e8',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2,ttf}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallbackDenylist: [/\/printables\//, /\/images\//],
        runtimeCaching: [
          {
            urlPattern: /\/images\/.*\.(jpg|png)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'album-images', expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
          {
            urlPattern: /\/printables\/.*$/,
            handler: 'CacheFirst',
            options: { cacheName: 'printables', expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 2500,
  },
})
