import rollupTypescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default {
  input: `src/index.ts`,
  output: {
    file: pkg.main,
    format: 'cjs',
  },
  plugins: [rollupTypescript()],
}
