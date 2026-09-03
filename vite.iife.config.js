import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,
    minify: 'oxc',
    assetsInlineLimit: 0,
    lib: {
      entry: 'src/iife.js',
      formats: ['iife'],
      name: 'showmo',
      fileName: () => 'showmo.min.js'
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        assetFileNames: 'showmo[extname]'
      }
    }
  }
})
