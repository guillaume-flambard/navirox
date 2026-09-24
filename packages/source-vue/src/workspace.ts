import type { Screen } from '@memolabs-apps/workflow'
import type {
  WorkspaceProvider,
  WorkspaceScaffoldInput,
  WorkspaceScaffoldResult,
} from '@memolabs-apps/source'

interface ScreenManifest {
  readonly screenId: string
  readonly outputPath: string
}

const VUE_PACKAGE = 'vue'
const VUE_COMPILER_PACKAGE = '@vue/compiler-sfc'

const PACKAGE_JSON = `${JSON.stringify(
  {
    name: 'navirox-generated-workspace',
    private: true,
    type: 'module',
    scripts: {
      test: 'node scripts/verify-generated.mjs',
    },
    dependencies: {
      [VUE_COMPILER_PACKAGE]: '3.5.43',
      [VUE_PACKAGE]: '3.5.43',
    },
  },
  undefined,
  2,
)}\n`

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Navirox generated workspace</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`

const MAIN_TS = `import { createApp } from '${VUE_PACKAGE}'
import App from './App.vue'
import { registerNativePrimitives } from './native'

const app = createApp(App)
registerNativePrimitives(app)
app.mount('#app')
`

const NATIVE_TS = `import { defineComponent, h, type App } from '${VUE_PACKAGE}'

const primitive = (name: string, tag: string) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(tag, attrs, slots)
    },
  })

const textInput = defineComponent({
  name: 'text-input',
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, Number],
      default: '',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () =>
      h('input', {
        ...attrs,
        value: props.modelValue,
        onInput: (event: Event) => {
          const target = event.target
          if (target instanceof HTMLInputElement) emit('update:modelValue', target.value)
        },
      })
  },
})

export function registerNativePrimitives(app: App): void {
  app.component('view', primitive('view', 'div'))
  app.component('text', primitive('text', 'span'))
  app.component('pressable', primitive('pressable', 'button'))
  app.component('text-input', textInput)
  app.component('image', primitive('image', 'img'))
  app.component('link', primitive('link', 'a'))
  app.component('picker', primitive('picker', 'select'))
  app.component('picker-item', primitive('picker-item', 'option'))
  app.component('scroll-view', primitive('scroll-view', 'div'))
}
`

const VERIFY_GENERATED = `import { readdirSync, readFileSync } from 'node:fs'
import { compileScript, compileTemplate, parse } from '${VUE_COMPILER_PACKAGE}'

const roots = [
  { directory: new URL('../src/', import.meta.url), label: 'src/' },
  { directory: new URL('../generated/', import.meta.url), label: 'generated/' },
]

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
    return entry.isDirectory() ? sourceFiles(path) : path.pathname.endsWith('.vue') ? [path.pathname] : []
  })
}

const files = roots.flatMap(({ directory, label }) =>
  sourceFiles(directory).map((file) => ({ file, filename: label + file.slice(directory.pathname.length) })),
)

for (const { file, filename } of files) {
  const source = readFileSync(file, 'utf8')
  const parsed = parse(source, { filename })

  if (parsed.errors.length > 0) {
    throw new Error(filename + ': ' + parsed.errors.map(String).join('; '))
  }

  if (parsed.descriptor.scriptSetup !== null) {
    compileScript(parsed.descriptor, { id: filename })
  }

  if (parsed.descriptor.template !== null) {
    const compiled = compileTemplate({
      id: filename,
      filename,
      source: parsed.descriptor.template.content,
    })

    if (compiled.errors.length > 0) {
      throw new Error(filename + ': ' + compiled.errors.map(String).join('; '))
    }
  }
}

console.log('Verified ' + files.length + ' Vue SFCs.')
`

function componentName(outputPath: string): string {
  const base =
    outputPath
      .split('/')
      .at(-1)
      ?.replace(/\.vue$/, '') ?? 'Screen'
  const name = base.replace(/[^A-Za-z0-9_$]+/g, '_')
  return /^[A-Za-z_$]/.test(name) ? name : `Screen_${name}`
}

function manifestFor(
  screen: Screen,
  files: readonly { readonly path: string; readonly content: string }[],
): ScreenManifest | undefined {
  for (const file of files) {
    if (!file.path.endsWith('.manifest.json')) continue

    try {
      const manifest = JSON.parse(file.content) as Partial<ScreenManifest>
      if (manifest.screenId === screen.id && typeof manifest.outputPath === 'string') {
        return { screenId: screen.id, outputPath: manifest.outputPath }
      }
    } catch {
      continue
    }
  }

  return undefined
}

function appFile(
  lowering: WorkspaceScaffoldInput['lowering'],
  emission: WorkspaceScaffoldInput['emission'],
): string | undefined {
  const screens = lowering.workflow.screens.filter((screen) => screen.coverage.kind === 'generated')
  const components: { readonly name: string; readonly path: string }[] = []
  const names = new Set<string>()

  for (const screen of screens) {
    const manifest = manifestFor(screen, emission.files)
    if (manifest === undefined) continue

    let name = componentName(manifest.outputPath)
    const base = name
    let suffix = 2
    while (names.has(name)) {
      name = `${base}${suffix}`
      suffix += 1
    }
    names.add(name)
    components.push({ name, path: manifest.outputPath })
  }

  if (components.length === 0) return undefined

  const imports = components
    .map((component) => `import ${component.name} from '../${component.path}'`)
    .join('\n')
  const body = components.map((component) => `    <${component.name} />`).join('\n')

  return `<script setup lang="ts">
${imports}
</script>

<template>
  <main>
${body}
  </main>
</template>
`
}

export function createVueWorkspaceProvider(): WorkspaceProvider {
  return {
    id: 'workspace:vue',
    scaffold: ({ lowering, emission }: WorkspaceScaffoldInput): WorkspaceScaffoldResult => {
      const app = appFile(lowering, emission)

      if (app === undefined) {
        return {
          files: [],
          findings: [
            {
              code: 'scaffold-no-screens',
              message:
                'The workflow has no generated screen from which to create a runnable workspace.',
            },
          ],
          commands: [],
        }
      }

      return {
        files: [
          { path: 'package.json', content: PACKAGE_JSON },
          { path: 'index.html', content: INDEX_HTML },
          { path: 'src/main.ts', content: MAIN_TS },
          { path: 'src/native.ts', content: NATIVE_TS },
          { path: 'src/App.vue', content: app },
          { path: 'scripts/verify-generated.mjs', content: VERIFY_GENERATED },
        ],
        findings: [],
        commands: ['pnpm test'],
      }
    },
  }
}
