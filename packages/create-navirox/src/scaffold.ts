import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveNames, type IAppNames } from './names.js'

/**
 * The scaffolding itself: copy the template, rewrite the identity, land.
 *
 * The template is a real application rather than a set of files written out as
 * strings. That is deliberate. The template is the same tree the acceptance app
 * is, so it is known to build on both platforms, and nothing that ships inside
 * it has to be kept in sync by hand.
 */

const HERE = dirname(fileURLToPath(import.meta.url))

/**
 * The template sits beside `src` and `dist`, so it resolves the same way whether
 * this runs from source under vitest or from the built output.
 */
export const TEMPLATE_DIRECTORY = join(HERE, '..', 'template')

/**
 * Nothing here is authored: it is build output, a package manager's store, or a
 * value this machine wrote about itself and that would be wrong on any other.
 */
const EXCLUDED_ENTRIES = new Set([
  'node_modules',
  'build',
  'Pods',
  '.gradle',
  '.turbo',
  '.impeccable',
  'local.properties',
  '.xcode.env.local',
])

/**
 * The identity in the template, as three strings.
 *
 * The reverse-DNS id is replaced before the PascalCase one, because the Pascal
 * name appears inside the test target name too (`VueBasicTests` becomes
 * `MyAppTests` for free that way), and because a partial replacement of the
 * id would leave a name that no longer matches any path on disk.
 */
const TEMPLATE_PACKAGE_ID = 'dev.navirox.vuebasic'
const TEMPLATE_PASCAL_NAME = 'VueBasic'
const TEMPLATE_ANDROID_SOURCE_DIR = 'dev/navirox/vuebasic'

/**
 * Every file that carries the identity in its contents. The corresponding path
 * names are renamed separately, see `renameIdentityPaths`.
 */
const IDENTITY_FILES = [
  'android/app/build.gradle',
  'android/settings.gradle',
  'android/app/src/main/res/values/strings.xml',
  'android/app/src/main/java/dev/navirox/vuebasic/MainActivity.kt',
  'android/app/src/main/java/dev/navirox/vuebasic/MainApplication.kt',
  'app.json',
  'ios/Podfile',
  'ios/VueBasic/AppDelegate.swift',
  'ios/VueBasic/Info.plist',
  'ios/VueBasic/LaunchScreen.storyboard',
  'ios/VueBasic.xcodeproj/project.pbxproj',
  'ios/VueBasic.xcodeproj/xcshareddata/xcschemes/VueBasic.xcscheme',
  'ios/VueBasic.xcworkspace/contents.xcworkspacedata',
]

/**
 * The Navirox packages an app depends on, the directory each one lives in, and
 * the manifest field it is declared in.
 *
 * The CLI is a devDependency because it is a tool rather than something the app
 * imports at runtime, and it has to be declared somewhere: the app the
 * scaffolder writes is meant to be run with `navirox dev`, so a fresh app that
 * did not depend on the CLI would need a global install to take its first step.
 */
const NAVIROX_PACKAGES = [
  { name: '@memolabs-apps/metro-preset', directory: 'metro-preset', field: 'dependencies' },
  { name: '@memolabs-apps/native', directory: 'native', field: 'dependencies' },
  { name: '@memolabs-apps/runtime-symbiote', directory: 'runtime-symbiote', field: 'dependencies' },
  { name: '@memolabs-apps/ui', directory: 'ui', field: 'dependencies' },
  { name: '@memolabs-apps/cli', directory: 'cli', field: 'devDependencies' },
] as const

/** Thrown when the destination already holds something, rather than overwriting it. */
export class TargetNotEmptyError extends Error {
  constructor(targetDir: string) {
    super(
      `"${targetDir}" already exists and is not empty. Choose another name, or remove it first.`,
    )
    this.name = 'TargetNotEmptyError'
  }
}

/** Thrown when the template itself is missing, which means a broken installation. */
export class TemplateMissingError extends Error {
  constructor(directory: string) {
    super(
      `The Navirox template was not found at "${directory}". That means this installation is incomplete, so reinstall create-navirox.`,
    )
    this.name = 'TemplateMissingError'
  }
}

export interface IScaffoldOptions {
  /** The name a person typed. Any of `my-app`, `MyApp` or `my app` work. */
  readonly name: string
  /** The directory to create. Must not already hold something. */
  readonly targetDir: string
}

export interface IScaffoldResult {
  readonly names: IAppNames
  readonly targetDir: string
  /** How many files were written, so the caller can report something concrete. */
  readonly files: number
  /**
   * Things the caller should tell the user about. Empty on a normal run, and
   * never used to hide a failure.
   */
  readonly warnings: readonly string[]
}

/**
 * Copies the template into `targetDir` and rewrites it into an app named
 * `options.name`.
 */
export function scaffoldApp(options: IScaffoldOptions): IScaffoldResult {
  const names = deriveNames(options.name)
  const { targetDir } = options

  if (!existsSync(TEMPLATE_DIRECTORY)) {
    throw new TemplateMissingError(TEMPLATE_DIRECTORY)
  }
  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    throw new TargetNotEmptyError(targetDir)
  }

  mkdirSync(targetDir, { recursive: true })
  cpSync(TEMPLATE_DIRECTORY, targetDir, { recursive: true, filter: shouldCopy })
  const files = countFiles(targetDir)

  // Contents first, then paths. IDENTITY_FILES names the paths as the template
  // spells them, so moving a directory before its files are read would leave the
  // rewrite pointing at a path that no longer exists.
  for (const path of IDENTITY_FILES) {
    rewriteFile(join(targetDir, path), names)
  }
  renameIdentityPaths(targetDir, names)

  const warnings = rewriteManifest(join(targetDir, 'package.json'), names, targetDir)

  return { names, targetDir, files, warnings }
}

/** Drops build output, package stores and values that are true only on this machine. */
function shouldCopy(source: string): boolean {
  const name = basename(source)
  if (EXCLUDED_ENTRIES.has(name)) {
    return false
  }
  return !name.endsWith('.tsbuildinfo')
}

function countFiles(directory: string): number {
  let total = 0
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    total += entry.isDirectory() ? countFiles(join(directory, entry.name)) : 1
  }
  return total
}

/**
 * Renames the paths that carry the identity, deepest first so a rename never
 * invalidates a path that has not been visited yet.
 *
 * Files carry the identity too, not only directories. The bridging header is
 * named after the target, and the rewrite above points the Xcode project at the
 * new name, so leaving the file behind produces a build that fails on a missing
 * input rather than anything that reads like a naming problem. Each file is
 * renamed where it sits, inside the directory that still carries the template
 * name, and the directory rename below carries it to its final home.
 */
function renameIdentityPaths(targetDir: string, names: IAppNames): void {
  const slug = packageSlug(names)

  const renames: readonly (readonly [string, string])[] = [
    [
      join('ios', TEMPLATE_PASCAL_NAME, `${TEMPLATE_PASCAL_NAME}-Bridging-Header.h`),
      join('ios', TEMPLATE_PASCAL_NAME, `${names.pascalName}-Bridging-Header.h`),
    ],
    [
      join('ios', 'VueBasic.xcodeproj', 'xcshareddata', 'xcschemes', 'VueBasic.xcscheme'),
      join(
        'ios',
        'VueBasic.xcodeproj',
        'xcshareddata',
        'xcschemes',
        `${names.pascalName}.xcscheme`,
      ),
    ],
    [join('ios', 'VueBasic'), join('ios', names.pascalName)],
    [join('ios', 'VueBasic.xcworkspace'), join('ios', `${names.pascalName}.xcworkspace`)],
    [join('ios', 'VueBasic.xcodeproj'), join('ios', `${names.pascalName}.xcodeproj`)],
    [
      join('android', 'app', 'src', 'main', 'java', TEMPLATE_ANDROID_SOURCE_DIR),
      join('android', 'app', 'src', 'main', 'java', 'dev', 'navirox', slug),
    ],
  ]

  for (const [from, to] of renames) {
    const source = join(targetDir, from)
    if (existsSync(source)) {
      renameSync(source, join(targetDir, to))
    }
  }
}

/**
 * Rewrites one file in place, then checks that nothing was missed. A leftover
 * identity string is a broken app that fails much later, at pod install or at
 * launch, so it is worth failing here instead.
 */
function rewriteFile(path: string, names: IAppNames): void {
  const original = readFileSync(path, 'utf8')
  const rewritten = original
    .replaceAll(TEMPLATE_PACKAGE_ID, names.packageId)
    .replaceAll(TEMPLATE_PASCAL_NAME, names.pascalName)

  if (rewritten === original) {
    throw new Error(`"${path}" did not contain the template identity, so it was not rewritten.`)
  }
  writeFileSync(path, rewritten)
}

/**
 * The npm name and the two Navirox dependencies live in `package.json`, which is
 * JSON rather than text, so it is edited as data instead of patched as a string.
 */
function rewriteManifest(path: string, names: IAppNames, targetDir: string): readonly string[] {
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as {
    name?: string
    description?: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const warnings: string[] = []

  manifest.name = names.dirName
  manifest.description = `${names.displayName}, built with Navirox.`

  const workspaceRoot = findWorkspaceRoot()
  if (workspaceRoot === undefined) {
    warnings.push(
      'The Navirox packages are not all published yet. This app points at version 0.0.0, which will not install until they are, or until you point those entries at packed tarballs or at the path to a Navirox checkout.',
    )
  } else {
    warnings.push(
      'The Navirox packages are linked from your checkout instead of installed from a registry, because they are not all published yet. Their own dependencies resolve from that checkout, so run `pnpm build` there once before `navirox dev`.',
    )
  }

  for (const naviroxPackage of NAVIROX_PACKAGES) {
    const group = manifest[naviroxPackage.field]

    if (group === undefined) {
      continue
    }
    // `link:` rather than `file:`, and the difference is the whole reason this
    // works. `file:` asks the package manager to install the linked package's own
    // dependencies into it, and those dependencies are workspace ranges that
    // cannot resolve outside the Navirox workspace. `link:` only makes the
    // symlink, which is what an app borrowing built packages from a checkout
    // wants anyway.
    //
    // Both sides are resolved through their real path before the relative hop is
    // computed. On macOS a temporary directory is reached through a symlink
    // (`/tmp` is `/private/tmp`), and the package manager resolves the range
    // against the physical directory, so a lexically correct relative path can
    // land somewhere that does not exist.
    group[naviroxPackage.name] =
      workspaceRoot === undefined
        ? '0.0.0'
        : `link:${toPosix(relative(realpathSync(targetDir), realpathSync(join(workspaceRoot, 'packages', naviroxPackage.directory))))}`
  }

  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`)
  return warnings
}

/**
 * Walks up from this file looking for the workspace file. Running from a Navirox
 * checkout is the normal case today, and it is what makes `npm create navirox`
 * produce an app that installs: the alternative is a version range pointing at
 * packages that do not exist on the registry yet.
 */
function findWorkspaceRoot(): string | undefined {
  let directory = HERE
  for (let depth = 0; depth < 6; depth += 1) {
    if (existsSync(join(directory, 'pnpm-workspace.yaml'))) {
      return directory
    }
    const parent = dirname(directory)
    if (parent === directory) {
      break
    }
    directory = parent
  }
  return undefined
}

function packageSlug(names: IAppNames): string {
  return names.packageId.replace('dev.navirox.', '')
}

function toPosix(path: string): string {
  return path.split(sep).join('/')
}
