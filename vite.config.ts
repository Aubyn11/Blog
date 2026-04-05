import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: [
        'express',
        'cors',
        'helmet',
        'compression',
        'express-rate-limit',
        'mongoose',
        'bcryptjs',
        'jsonwebtoken',
        'dotenv',
        'octokit',
        'multer',
        'fs',
        'path',
        'url',
        'module',
        'crypto',
        'http',
        'https',
        'stream',
        'buffer',
        'util',
        'events',
        'os',
        'net',
        'tls',
        'zlib',
      ]
    }
  }
})