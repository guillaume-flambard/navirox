import { createMemoryReader } from '../src/readers.js'
import type { DiscoveryReader } from '../src/types.js'

const ROOT_PACKAGE_JSON = JSON.stringify(
  {
    name: 'field-notes-monorepo',
    version: '0.1.0',
    private: true,
  },
  null,
  2,
)

const PNPM_WORKSPACE = ['packages:', "  - 'packages/*'", ''].join('\n')

const APP_PACKAGE_JSON = JSON.stringify(
  {
    name: '@field-notes/app',
    version: '0.1.0',
    private: true,
    scripts: {
      build: 'vite build',
      dev: 'vite',
    },
    dependencies: {
      vue: '^3.4.0',
    },
  },
  null,
  2,
)

const SHARED_PACKAGE_JSON = JSON.stringify(
  {
    name: '@field-notes/shared',
    version: '0.1.0',
    types: './dist/index.d.ts',
  },
  null,
  2,
)

export const PNPM_WORKSPACE_FILES: Record<string, string> = {
  'package.json': ROOT_PACKAGE_JSON,
  'pnpm-workspace.yaml': PNPM_WORKSPACE,
  'packages/app/package.json': APP_PACKAGE_JSON,
  'packages/app/vite.config.ts':
    "import { defineConfig } from 'vite'\n\nexport default defineConfig({})\n",
  'packages/app/src/main.ts': "import { createApp } from 'vue'\n\ncreateApp({}).mount('#app')\n",
  'packages/shared/package.json': SHARED_PACKAGE_JSON,
  'packages/shared/src/index.ts': 'export const shared = 1\n',
}

/**
 * A pnpm workspace with no lockfile checked in. Expected:
 * `eligible-with-deltas` with `missing-lockfile` and `unresolved-versions`.
 */
export function pnpmWorkspaceReader(): DiscoveryReader {
  return createMemoryReader(PNPM_WORKSPACE_FILES)
}
