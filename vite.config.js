import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/__pycache__/**']
    },
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || process.env.VITE_FLASK_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('@vladmandic/face-api')) {
              return 'vendor-faceapi';
            }
          }
        }
      }
    }
  }
})
