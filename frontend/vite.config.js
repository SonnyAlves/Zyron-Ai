import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Three.js into its own chunk (lazy-loaded)
          'three': ['three'],
          // Separate React vendor code
          'react-vendor': ['react', 'react-dom', '@clerk/clerk-react'],
        }
      }
    },
    // Increase chunk size warning limit since Three.js chunk will be ~400-500KB
    chunkSizeWarningLimit: 600,
  },
})
