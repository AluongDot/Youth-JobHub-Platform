import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
    // Add proxy for development to avoid CORS issues
    proxy: {
      '/api': {
        target: 'https://youth-jobhub-platform.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Add build configuration for Vercel
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  // Define environment variables
  define: {
    'process.env': {}
  }
})