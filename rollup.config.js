const rollupTypescript = require('@rollup/plugin-typescript')
const pkg = require('./package.json')

module.exports = {
  input: `src/index.ts`,
  output: {
    file: pkg.main,
    format: 'cjs',
  },
  plugins: [rollupTypescript()],
}
