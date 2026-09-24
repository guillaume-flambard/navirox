import { WORKFLOW_IR_SCHEMA_VERSION, type Screen, type Workflow } from '@memolabs-apps/workflow'
import { describe, expect, it } from 'vitest'
import { createVueWorkspaceProvider } from './workspace.js'
import type { WorkspaceScaffoldInput } from '@memolabs-apps/source'

const screen: Screen = {
  id: 'vue:src/views/Home.vue:screen:default',
  name: 'Home',
  source: { adapterId: 'vue', file: 'src/views/Home.vue', line: 1 },
  coverage: { kind: 'generated' },
  nodes: [],
  state: [],
  actions: [],
  layout: [],
  styles: [],
  resources: [],
}

function input(
  workflow: Workflow,
  files: { readonly path: string; readonly content: string }[],
): WorkspaceScaffoldInput {
  return {
    lowering: {
      workflow,
      coverage: { generated: 1, manualRequired: 0, excluded: 0, refused: 0 },
      findings: [],
    },
    emission: { files, findings: [] },
  }
}

describe('the generated Vue workspace provider', () => {
  it('creates the package, entrypoint, runtime, app and verifier files', () => {
    const result = createVueWorkspaceProvider().scaffold(
      input({ schemaVersion: WORKFLOW_IR_SCHEMA_VERSION, id: 'fixture', screens: [screen] }, [
        { path: 'generated/Home.vue', content: '<template><view /></template>\n' },
        {
          path: 'generated/Home.manifest.json',
          content: `${JSON.stringify({
            screenId: screen.id,
            outputPath: 'generated/Home.vue',
          })}\n`,
        },
      ]),
    )

    expect(result.findings).toEqual([])
    expect(result.commands).toEqual(['pnpm test'])
    expect(result.files.map((file) => file.path)).toEqual([
      'package.json',
      'index.html',
      'src/main.ts',
      'src/native.ts',
      'src/App.vue',
      'scripts/verify-generated.mjs',
    ])
    expect(result.files.find((file) => file.path === 'src/App.vue')?.content).toContain(
      "import Home from '../generated/Home.vue'",
    )
    expect(
      result.files.find((file) => file.path === 'scripts/verify-generated.mjs')?.content,
    ).toContain('compileTemplate')
  })

  it('returns a finding and no files when no generated screen exists', () => {
    const result = createVueWorkspaceProvider().scaffold(
      input({ schemaVersion: WORKFLOW_IR_SCHEMA_VERSION, id: 'fixture', screens: [] }, []),
    )

    expect(result.files).toEqual([])
    expect(result.findings).toEqual([
      {
        code: 'scaffold-no-screens',
        message: 'The workflow has no generated screen from which to create a runnable workspace.',
      },
    ])
  })
})
