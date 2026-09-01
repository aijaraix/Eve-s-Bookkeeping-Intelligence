import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8787';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? { ignored: ['**'] } : {},
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true
      },
      '/review': {
        target: API_PROXY_TARGET,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true
      }
    }
  }
});
