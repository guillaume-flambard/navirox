import { createMemoryReader } from '../src/readers.js'
import type { DiscoveryReader } from '../src/types.js'

const PACKAGE_JSON = JSON.stringify(
  {
    name: 'field-notes-collision',
    version: '0.1.0',
    private: true,
    packageManager: 'pnpm@9.12.0',
    scripts: {
      build: 'vite build',
    },
    dependencies: {
      '@angular/core': '^17.0.0',
      vue: '^3.4.0',
    },
  },
  null,
  2,
)

const PNPM_LOCK = [
  "lockfileVersion: '9.0'",
  'importers:',
  '  .:',
  '    dependencies:',
  '      @angular/core:',
  '        specifier: ^17.0.0',
  '        version: 17.3.0',
  '      vue:',
  '        specifier: ^3.4.0',
  '        version: 3.4.21',
  '',
].join('\n')

export const FRAMEWORK_COLLISION_FILES: Record<string, string> = {
  'package.json': PACKAGE_JSON,
  'pnpm-lock.yaml': PNPM_LOCK,
  'vite.config.ts': "import { defineConfig } from 'vite'\n\nexport default defineConfig({})\n",
  'src/main.ts': [
    "import { createApp } from 'vue'",
    "import { VERSION } from '@angular/core'",
    '',
    'createApp({ version: VERSION })',
    '',
  ].join('\n'),
}

/**
 * Two frameworks with equal evidence. Expected: `refused` with both
 * candidates recorded and no arbitrary choice.
 */
export function frameworkCollisionReader(): DiscoveryReader {
  return createMemoryReader(FRAMEWORK_COLLISION_FILES)
}
