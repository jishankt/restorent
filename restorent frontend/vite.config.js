import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://157.173.96.252:6034',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
      },
      '/socket.io': {
        target: 'http://157.173.96.252:6034',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/static/uploads': {
        target: 'http://157.173.96.252:6034',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
});
//127.0.0.1