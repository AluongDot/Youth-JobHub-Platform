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
    cors: true,
    // Add proxy for development to avoid CORS issues
    proxy: {
      '/api': {
        target: 'https://youth-jobhub-platform.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🟡 [PROXY] Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🟡 [PROXY] Sending Request:', req.method, req.url);
          });
        }
      }
    }
  },
  // Add build configuration for Vercel
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  // Define environment variables
  define: {
    'process.env': {},
    'global': 'globalThis'
  },
  // Add CSP headers
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})