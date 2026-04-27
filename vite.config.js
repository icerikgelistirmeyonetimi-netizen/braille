import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Braille Eğitim',
        short_name: 'Braille',
        description: 'Görme engelliler için Türkçe Braille alfabesi öğretim uygulaması',
        theme_color: '#f5f7fb',
        background_color: '#f5f7fb',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'tr-TR',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
});
