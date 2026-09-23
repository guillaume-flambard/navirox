import { createMemoryReader } from '../src/readers.js'
import type { DiscoveryReader } from '../src/types.js'

const PACKAGE_JSON = JSON.stringify(
  {
    name: 'field-notes-custom',
    version: '0.1.0',
    private: true,
    packageManager: 'pnpm@9.12.0',
    scripts: {
      build: 'node ./scripts/build-custom.js',
    },
    dependencies: {
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
  '      vue:',
  '        specifier: ^3.4.0',
  '        version: 3.4.21',
  '',
].join('\n')

const CUSTOM_BUILD = [
  '// House build driver: bundles with private loader plugins.',
  'export async function build() {',
  "  throw new Error('not covered')",
  '}',
  '',
].join('\n')

export const CUSTOM_CONFIG_FILES: Record<string, string> = {
  'package.json': PACKAGE_JSON,
  'pnpm-lock.yaml': PNPM_LOCK,
  'scripts/build-custom.js': CUSTOM_BUILD,
  'src/main.ts': "import { createApp } from 'vue'\n\ncreateApp({}).mount('#app')\n",
}

/** A custom build driver no profile covers. Expected: `refused`. */
export function customConfigReader(): DiscoveryReader {
  return createMemoryReader(CUSTOM_CONFIG_FILES)
}
