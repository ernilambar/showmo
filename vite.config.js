import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: 'oxc',
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: () => 'showmo.esm.js'
    },
    outDir: 'dist'
  }
})
