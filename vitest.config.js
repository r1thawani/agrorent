import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.js on purpose: the app's Vite config wires
// up the React plugin and Tailwind's Vite plugin for the dev/build pipeline,
// neither of which the current test suite (plain-JS unit tests for
// src/utils and src/services helpers) needs. Keeping them apart means
// adding tests can't accidentally change how `npm run dev` / `npm run build`
// behave.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
