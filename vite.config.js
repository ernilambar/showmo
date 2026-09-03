import { defineConfig } from 'vite'
import browserslistToEsbuild from 'browserslist-to-esbuild'

export default defineConfig({
  build: {
    target: browserslistToEsbuild(),
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
