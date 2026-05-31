module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        moduleResolution: 'node',
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        skipLibCheck: true,
        paths: {
          '@/*': ['./src/*'],
          '@core/*': ['./src/@core/*'],
          '@layouts/*': ['./src/@layouts/*'],
          '@menu/*': ['./src/@menu/*'],
          '@assets/*': ['./src/assets/*'],
          '@components/*': ['./src/components/*'],
          '@configs/*': ['./src/configs/*'],
          '@views/*': ['./src/views/*']
        }
      },
      diagnostics: false
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Force React development build for act() support
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom'),
    '^react-dom/test-utils$': require.resolve('react-dom/test-utils')
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts']
}
