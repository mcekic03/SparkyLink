import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

// Separate from vite.config.ts: the app config loads the router plugin, which
// rewrites routeTree.gen.ts on every run, and devtools.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [viteReact()],
  test: {
    // node by default; files that render opt in with a
    // `@vitest-environment jsdom` docblock. jsdom costs more to start than most
    // of this suite costs to run.
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
  },
})
