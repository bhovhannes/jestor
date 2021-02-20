module.exports = {
  clearMocks: true,
  restoreMocks: true,
  preset: 'ts-jest',
  coverageDirectory: './coverage',
  coverageReporters: ['lcov', 'html', 'text-summary'],
  collectCoverageFrom: ['./src/**/*.ts'],
  globals: {
    'ts-jest': {
      diagnostics: {
        ignoreCodes: ['TS151001'],
      },
    },
  },
}
