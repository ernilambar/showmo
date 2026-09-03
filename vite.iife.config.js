import { defineConfig } from 'vite'
import browserslistToEsbuild from 'browserslist-to-esbuild'

export default defineConfig({
  build: {
    target: browserslistToEsbuild(),
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
