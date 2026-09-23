import { createMemoryReader } from '../src/readers.js'
import type { DiscoveryReader } from '../src/types.js'

const PACKAGE_JSON = JSON.stringify(
  {
    name: 'field-notes',
    version: '0.1.0',
    private: true,
    packageManager: 'pnpm@9.12.0',
    scripts: {
      build: 'vite build',
      dev: 'vite',
      test: 'vitest run',
    },
    dependencies: {
      vue: '^3.4.0',
      'vue-router': '^4.3.0',
    },
    devDependencies: {
      typescript: '~5.4.0',
      vite: '^5.0.0',
      vitest: '^5.0.1',
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
  '      vue-router:',
  '        specifier: ^4.3.0',
  '        version: 4.3.0',
  '    devDependencies:',
  '      typescript:',
  '        specifier: ~5.4.0',
  '        version: 5.4.5',
  '      vite:',
  '        specifier: ^5.0.0',
  '        version: 5.2.0',
  '      vitest:',
  '        specifier: ^5.0.1',
  '        version: 5.0.1',
  'packages:',
  '  vue@3.4.21:',
  '    resolution: {integrity: sha512-placeholder}',
  '  vue-router@4.3.0:',
  '    resolution: {integrity: sha512-placeholder}',
  '',
].join('\n')

const VITE_CONFIG = [
  "import { defineConfig } from 'vite'",
  '',
  'export default defineConfig({})',
  '',
].join('\n')

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      strict: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src'],
  },
  null,
  2,
)

const MAIN = [
  "import { createApp } from 'vue'",
  "import App from './App.vue'",
  '',
  "createApp(App).mount('#app')",
  '',
].join('\n')

const APP_VUE = [
  '<template>',
  '  <main>{{ title }}</main>',
  '</template>',
  '',
  '<script setup lang="ts">',
  "import { ref } from 'vue'",
  '',
  "const title = ref('Field notes')",
  '</script>',
  '',
].join('\n')

const ROUTER = ["import { ref } from 'vue'", '', "export const currentRoute = ref('/')", ''].join(
  '\n',
)

const INDEX_HTML = [
  '<!doctype html>',
  '<html lang="en">',
  '  <head>',
  '    <meta charset="utf-8" />',
  '    <title>Field notes</title>',
  '  </head>',
  '  <body>',
  '    <div id="app"></div>',
  '    <script type="module" src="/src/main.ts"></script>',
  '  </body>',
  '</html>',
  '',
].join('\n')

export const SINGLE_PACKAGE_FILES: Record<string, string> = {
  'package.json': PACKAGE_JSON,
  'pnpm-lock.yaml': PNPM_LOCK,
  'vite.config.ts': VITE_CONFIG,
  'tsconfig.json': TSCONFIG,
  'index.html': INDEX_HTML,
  'src/main.ts': MAIN,
  'src/App.vue': APP_VUE,
  'src/router/index.ts': ROUTER,
  'src/notes.test.ts': "import { describe, expect, it } from 'vitest'\n",
}

/** A conventional single package repository. Expected: `eligible`. */
export function singlePackageReader(): DiscoveryReader {
  return createMemoryReader(SINGLE_PACKAGE_FILES, [])
}
