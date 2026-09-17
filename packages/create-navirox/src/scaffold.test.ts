import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  scaffoldApp,
  TargetNotEmptyError,
  TEMPLATE_DIRECTORY,
  TemplateMissingError,
} from './scaffold'

const created: string[] = []

function targetPath(): string {
  const root = mkdtempSync(join(tmpdir(), 'navirox-scaffold-'))
  created.push(root)
  return join(root, 'my-app')
}

afterEach(() => {
  for (const root of created.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

function read(targetDir: string, relative: string): string {
  return readFileSync(join(targetDir, relative), 'utf8')
}

describe('scaffoldApp', () => {
  it('copies the template and reports how many files it wrote', () => {
    const targetDir = targetPath()
    const result = scaffoldApp({ name: 'My App', targetDir })

    expect(result.files).toBeGreaterThan(50)
    expect(existsSync(join(targetDir, 'App.vue'))).toBe(true)
    expect(existsSync(join(targetDir, 'index.js'))).toBe(true)
    expect(existsSync(join(targetDir, 'metro.config.js'))).toBe(true)
    expect(existsSync(join(targetDir, 'ios/Podfile'))).toBe(true)
    expect(existsSync(join(targetDir, 'android/settings.gradle'))).toBe(true)
  })

  it('rewrites every place the identity is written down', () => {
    const targetDir = targetPath()
    scaffoldApp({ name: 'My App', targetDir })

    expect(JSON.parse(read(targetDir, 'app.json'))).toEqual({
      name: 'MyApp',
      displayName: 'MyApp',
    })
    expect(JSON.parse(read(targetDir, 'package.json'))).toMatchObject({ name: 'my-app' })
    expect(read(targetDir, 'android/app/build.gradle')).toContain('dev.navirox.myapp')
    expect(read(targetDir, 'android/settings.gradle')).toContain("rootProject.name = 'MyApp'")
    expect(read(targetDir, 'android/app/src/main/res/values/strings.xml')).toContain(
      '<string name="app_name">MyApp</string>',
    )
    expect(read(targetDir, 'ios/Podfile')).toContain("target 'MyApp' do")
    expect(read(targetDir, 'ios/MyApp/AppDelegate.swift')).toContain('withModuleName: "MyApp"')
    expect(read(targetDir, 'ios/MyApp/Info.plist')).toContain('<string>MyApp</string>')
    expect(read(targetDir, 'ios/MyApp.xcworkspace/contents.xcworkspacedata')).toContain(
      'group:MyApp.xcodeproj',
    )
  })

  it('renames the paths the identity is baked into, including the scheme and test target', () => {
    const targetDir = targetPath()
    scaffoldApp({ name: 'My App', targetDir })

    expect(existsSync(join(targetDir, 'ios/MyApp.xcodeproj'))).toBe(true)
    expect(existsSync(join(targetDir, 'ios/MyApp.xcworkspace'))).toBe(true)
    expect(existsSync(join(targetDir, 'ios/MyApp'))).toBe(true)
    expect(existsSync(join(targetDir, 'ios/MyApp.xcodeproj/project.pbxproj'))).toBe(true)
    expect(existsSync(join(targetDir, 'ios/VueBasic.xcodeproj'))).toBe(false)
    expect(existsSync(join(targetDir, 'android/app/src/main/java/dev/navirox/myapp'))).toBe(true)
    expect(existsSync(join(targetDir, 'android/app/src/main/java/dev/navirox/vuebasic'))).toBe(
      false,
    )
  })

  it('leaves no trace of the template identity anywhere in the tree', () => {
    const targetDir = targetPath()
    scaffoldApp({ name: 'My App', targetDir })

    for (const relative of ['ios/MyApp.xcodeproj/project.pbxproj', 'app.json', 'package.json']) {
      expect(read(targetDir, relative)).not.toContain('VueBasic')
      expect(read(targetDir, relative)).not.toContain('vuebasic')
      expect(read(targetDir, relative)).not.toContain('vue-basic')
    }

    const scheme = read(targetDir, 'ios/MyApp.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme')

    expect(scheme).toContain('MyAppTests')
    expect(scheme).not.toContain('VueBasic')
  })

  it('never ships the artifacts that belong to the machine that built the example', () => {
    const targetDir = targetPath()
    scaffoldApp({ name: 'My App', targetDir })

    for (const relative of [
      'node_modules',
      'android/local.properties',
      'android/build',
      'android/app/build',
      'android/.gradle',
      'ios/Pods',
      'ios/build',
      'ios/.xcode.env.local',
      '.turbo',
      '.impeccable',
    ]) {
      expect(existsSync(join(targetDir, relative)), relative).toBe(false)
    }
  })

  it('carries every pin over from the template, changing only the Navirox entries', () => {
    const targetDir = targetPath()
    scaffoldApp({ name: 'My App', targetDir })

    const template = JSON.parse(readFileSync(join(TEMPLATE_DIRECTORY, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    const written = JSON.parse(read(targetDir, 'package.json')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }

    for (const group of ['dependencies', 'devDependencies'] as const) {
      for (const [name, version] of Object.entries(template[group])) {
        if (name.startsWith('@navirox/')) {
          continue
        }
        expect(written[group][name], name).toBe(version)
      }
    }

    // The Navirox entries are the only ones the scaffolder may move, because the
    // template points at this workspace and a new app cannot. The key sets still
    // have to match, which is what catches a scaffolder that drops or adds one.
    for (const group of ['dependencies', 'devDependencies'] as const) {
      expect(Object.keys(written[group]).sort()).toEqual(Object.keys(template[group]).sort())
    }
  })

  it('links the Navirox packages to this checkout, at a path that exists', () => {
    const targetDir = targetPath()
    const result = scaffoldApp({ name: 'My App', targetDir })
    const written = JSON.parse(read(targetDir, 'package.json')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
      description: string
    }

    const preset = written.dependencies['@navirox/metro-preset']
    const runtime = written.dependencies['@navirox/runtime-symbiote']
    const cli = written.devDependencies['@navirox/cli']

    expect(preset).toBeDefined()
    expect(runtime).toBeDefined()
    // The CLI is linked too, because `npx navirox dev` is the first thing a
    // person does in a new app and the app has to be able to find the command.
    expect(cli).toBeDefined()
    // `link:` and not `file:`. `file:` asks the package manager to install the
    // linked package's own dependencies, and those are workspace ranges that do
    // not resolve outside this workspace.
    expect(preset?.startsWith('link:')).toBe(true)
    expect(runtime?.startsWith('link:')).toBe(true)
    expect(cli?.startsWith('link:')).toBe(true)

    // The range has to be resolved from the physical directory, which is what the
    // package manager does. Resolving it any other way is how a path that reads
    // correctly points at nothing on disk.
    for (const range of [preset, runtime, cli]) {
      const linked = resolve(realpathSync(targetDir), (range ?? '').slice('link:'.length))
      expect(existsSync(linked), linked).toBe(true)
    }

    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('pnpm build')
    expect(written.description).toBe('My App, built with Navirox.')
  })

  it('refuses to write into a directory that already holds something', () => {
    const targetDir = targetPath()
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(join(targetDir, 'keep.txt'), 'not mine')

    expect(() => scaffoldApp({ name: 'My App', targetDir })).toThrow(TargetNotEmptyError)
    expect(existsSync(join(targetDir, 'keep.txt'))).toBe(true)
  })

  it('scaffolds into an existing but empty directory', () => {
    const targetDir = targetPath()
    mkdirSync(targetDir, { recursive: true })

    expect(() => scaffoldApp({ name: 'My App', targetDir })).not.toThrow()
    expect(readdirSync(targetDir).length).toBeGreaterThan(0)
  })

  it('names the template error so a broken install is diagnosable', () => {
    expect(new TemplateMissingError('/nowhere').message).toContain(
      'The Navirox template was not found at "/nowhere".',
    )
  })
})
