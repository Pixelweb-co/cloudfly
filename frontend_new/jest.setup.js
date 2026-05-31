/**
 * Jest setup file — forces React development mode so act() works in tests.
 *
 * In Jest 30 + React 18, the production build of React throws when act()
 * is called outside of a development environment. This setup file ensures
 * the React development build is loaded by setting the NODE_ENV to 'development'
 * before any tests run.
 */

// Force development mode for React act() support
process.env.NODE_ENV = 'development'

// Ensure React uses development build
const React = require('react')
if (!React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.warn('[jest.setup] React internals not available')
}
