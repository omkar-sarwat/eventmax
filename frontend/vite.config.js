import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const API_URL = env.VITE_API_URL || 'http://localhost:4000';

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 3000,
      strictPort: false,
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/health': {
          target: API_URL,
          changeOrigin: true,
          secure: false
        },
        '/status': {
          target: API_URL,
          changeOrigin: true,
          secure: false
        }
      }
    },
    envPrefix: 'VITE_',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@context': path.resolve(__dirname, './src/context'),
        '@utils': path.resolve(__dirname, './src/utils')
      }
    },
    build: {
      sourcemap: mode !== 'production',
      target: 'es2020',
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'axios', 'socket.io-client']
          }
        }
      }
    },
    preview: {
      port: 3000,
      host: true
    },
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg', '**/*.webp'],
    css: {
      devSourcemap: true
    }
  };
});
