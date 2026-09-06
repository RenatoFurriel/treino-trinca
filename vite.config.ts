import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// Em produção o app vive num subcaminho do GitHub Pages; em dev, na raiz.
const BASE = '/treino-trinca/'

export default defineConfig(({ mode }) => ({
  // 'production' cobre build e preview; o dev server segue na raiz.
  base: mode === 'production' ? BASE : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Treino Trinca',
        short_name: 'Trinca',
        description: 'Seu protocolo de treino, offline, na palma da mão.',
        lang: 'pt-BR',
        id: BASE,
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#08080a',
        theme_color: '#08080a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Rota funda aberta direto (/treino-trinca/evolucao) cai no index.
        navigateFallback: BASE + 'index.html',
        // As 22 fotos de execução passam do teto padrão de 2 MiB somadas.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
}))
