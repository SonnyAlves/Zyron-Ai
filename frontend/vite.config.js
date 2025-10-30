import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildInfoPlugin } from './scripts/build-info.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), buildInfoPlugin()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    // Optimize build output
    target: 'ES2020',
    minify: 'esbuild', // Use esbuild (built-in, no dependencies)
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Three.js into its own chunk (lazy-loaded)
          'three': ['three'],
          // Separate React vendor code
          'react-vendor': ['react', 'react-dom', '@clerk/clerk-react'],
          // Separate Supabase
          'supabase': ['@supabase/supabase-js'],
        },
        // Optimize chunk naming for caching
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      }
    },
    // Increase chunk size warning limit since Three.js chunk will be ~400-500KB
    chunkSizeWarningLimit: 600,
    // Optimize CSS code splitting
    cssCodeSplit: true,
    // Use source maps only in development
    sourcemap: false,
    // Optimize CSS minification
    cssMinify: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@clerk/clerk-react', '@supabase/supabase-js', 'zustand'],
    exclude: ['three'],
  },
})
