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
      // 排除所有后端专用包，防止被打包进前端 bundle 导致变量冲突
      external: [
        'express',
        'cors',
        'helmet',
        'compression',
        'express-rate-limit',
        'express-validator',
        'mongoose',
        'bcryptjs',
        'jsonwebtoken',
        'dotenv',
        'octokit',
        'multer',
        'uuid',
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