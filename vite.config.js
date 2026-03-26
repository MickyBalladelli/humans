import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel-compatible: ensure assets in /public are served at root
  publicDir: 'public',
  build: {
    // Produce a single-page app for Vercel
    outDir: 'dist',
    // Raise chunk warning limit for Three.js (it's large by design)
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Manual chunks: keep Three.js, MUI, and other large libs separate
        // from the main bundle for better caching
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three')) {
            return 'vendor-three';
          }
          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'vendor-mui';
          }
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('zustand')) {
            return 'vendor-zustand';
          }
        },
      },
    },
  },
})

