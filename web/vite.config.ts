import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 1904,
    host: true,
    open: false,
    allowedHosts: true,
    proxy: {
      '/v1': {
        target: 'http://localhost:2004',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 1904,
  },
});

