import { createMemoryReader } from '../src/readers.js'
import type { DiscoveryReader } from '../src/types.js'

const ROOT_PACKAGE_JSON = JSON.stringify(
  {
    name: 'field-notes-platform',
    version: '0.1.0',
    private: true,
    workspaces: ['apps/*', 'packages/*'],
    scripts: {
      build: 'turbo run build',
    },
    devDependencies: {
      nx: '^19.0.0',
      turbo: '^2.0.0',
    },
  },
  null,
  2,
)

const PNPM_LOCK = [
  "lockfileVersion: '9.0'",
  'importers:',
  '  apps/web:',
  '    dependencies:',
  '      vue:',
  '        specifier: ^3.4.0',
  '        version: 3.4.21',
  '  apps/admin:',
  '    dependencies:',
  '      vue:',
  '        specifier: ^3.4.0',
  '        version: 3.4.21',
  '',
].join('\n')

function appPackage(name: string): string {
  return JSON.stringify(
    {
      name,
      version: '0.1.0',
      private: true,
      scripts: {
        build: 'vite build',
      },
      dependencies: {
        vue: '^3.4.0',
      },
    },
    null,
    2,
  )
}

export const NX_TURBO_FILES: Record<string, string> = {
  'package.json': ROOT_PACKAGE_JSON,
  'pnpm-lock.yaml': PNPM_LOCK,
  'nx.json': JSON.stringify({ extends: 'nx/presets/npm.json' }, null, 2),
  'turbo.json': JSON.stringify({ $schema: 'https://turbo.build/schema.json' }, null, 2),
  'apps/web/package.json': appPackage('@field-notes/web'),
  'apps/web/src/main.ts': "import { createApp } from 'vue'\n\ncreateApp({}).mount('#app')\n",
  'apps/admin/package.json': appPackage('@field-notes/admin'),
  'apps/admin/src/main.ts': "import { createApp } from 'vue'\n\ncreateApp({}).mount('#app')\n",
  'packages/ui/package.json': JSON.stringify(
    { name: '@field-notes/ui', version: '0.1.0' },
    null,
    2,
  ),
}

/**
 * An Nx + Turborepo monorepo with two applications. Expected:
 * `manual-discovery-required` until one application is selected.
 */
export function nxTurboReader(): DiscoveryReader {
  return createMemoryReader(NX_TURBO_FILES)
}
