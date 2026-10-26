import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Build mode → environment file, swapped via a resolve alias.
const ENVIRONMENT_BY_MODE: Record<string, string> = {
  development: 'environment.ts',
  staging: 'environment.stg.ts',
  production: 'environment.prod.ts',
}

function resolveFromHere(relative: string) {
  return fileURLToPath(new URL(relative, import.meta.url))
}

function gitSha() {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    // No git in the build context — a Docker image built from a copied tree, say.
    return 'unknown'
  }
}

const config = defineConfig(({ mode }) => {
  const environmentFile = ENVIRONMENT_BY_MODE[mode] ?? 'environment.ts'

  return {
    server: {
      host: true,
      // Bind mounts from Windows into the container deliver no file events.
      watch: { usePolling: process.env.DOCKER_POLLING === '1' },
      // API is same-origin; in development Vite forwards /api to the backend
      // (sparky-web inside Docker, or a locally running stack).
      proxy: {
        '/api': {
          target: process.env.VITE_DEV_API_PROXY ?? 'http://localhost',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      // Resolves `#/*` and `@/*` from tsconfig.json. Native since Vite 8, which
      // replaces the vite-tsconfig-paths plugin.
      tsconfigPaths: true,
      alias: [
        {
          // TypeScript still resolves environment.ts; all three share one type.
          find: /^#\/config\/environment$/,
          replacement: resolveFromHere(`./src/config/${environmentFile}`),
        },
      ],
    },
    define: {
      __BUILD_SHA__: JSON.stringify(gitSha()),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    plugins: [
      devtools(),
      tailwindcss(),
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      viteReact(),
    ],
  }
})

export default config
