import { defineConfig } from 'vite'

export default defineConfig({
  // Configuration for building the library
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
}) 