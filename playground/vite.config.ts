import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get current directory using import.meta.url for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point directly to the parent's src directory
      'emoji-picker': path.resolve(__dirname, '../src/index.ts'),
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  // Tell Vite to watch the parent src directory
  optimizeDeps: {
    // Force reoptimize on changes
    force: true
  }
}) 