import { createHash } from 'node:crypto'
import { REPOSITORY_CAPABILITY_MANIFEST_SCHEMA_VERSION } from './types.js'
import type {
  ApplicationEntry,
  BuildEntry,
  ConfigRecord,
  ConfigUnderstanding,
  ConventionRecord,
  CustomConvention,
  DiscoverOptions,
  DiscoveryConfidence,
  DiscoveryDelta,
  DiscoveryDiagnostic,
  DiscoveryFact,
  DiscoveryReader,
  EligibilityClassification,
  EscapeHatch,
  FrameworkCandidate,
  GeneratedDirectory,
  LockfileRecord,
  PackageEntry,
  PackageManagerKind,
  PluginRecord,
  RepositoryCapabilityManifest,
  ResolvedVersion,
  WorkspaceDeclaration,
} from './types.js'

/**
 * Evidence tables. These are plain data, never imports: discovery names a
 * framework, a tool or a plugin only as a string it read in a manifest, a
 * lockfile or a file name. Adding support for a new name is a data change
 * here, not a new dependency.
 */

interface LockfileEvidence {
  readonly file: string
  readonly manager: Exclude<PackageManagerKind, 'unknown'>
}

const LOCKFILE_EVIDENCE: readonly LockfileEvidence[] = [
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
  { file: 'package-lock.json', manager: 'npm' },
  { file: 'npm-shrinkwrap.json', manager: 'npm' },
  { file: 'yarn.lock', manager: 'yarn' },
  { file: 'bun.lockb', manager: 'bun' },
  { file: 'bun.lock', manager: 'bun' },
]

const PACKAGE_MANAGER_FIELD_PREFIXES: readonly (readonly [string, PackageManagerKind])[] = [
  ['pnpm@', 'pnpm'],
  ['npm@', 'npm'],
  ['yarn@', 'yarn'],
  ['bun@', 'bun'],
]

const GENERATED_DIRECTORY_NAMES: readonly string[] = [
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.turbo',
  '.nx',
  '.output',
  '.vite',
  '.parcel-cache',
]

interface ConfigEvidence {
  readonly pattern: RegExp
  readonly kind: string
  readonly understanding: ConfigUnderstanding
}

const CONFIG_EVIDENCE: readonly ConfigEvidence[] = [
  { pattern: /(^|\/)vite\.config\.[mc]?[jt]s$/, kind: 'vite', understanding: 'understood' },
  { pattern: /(^|\/)webpack\.config\.[mc]?js$/, kind: 'webpack', understanding: 'understood' },
  { pattern: /(^|\/)rollup\.config\.[mc]?[jt]s$/, kind: 'rollup', understanding: 'understood' },
  { pattern: /(^|\/)tsconfig(\.[^/]+)?\.json$/, kind: 'typescript', understanding: 'understood' },
  { pattern: /(^|\/)babel\.config\.[mc]?js$/, kind: 'babel', understanding: 'understood' },
  { pattern: /(^|\/)\.babelrc(\.json)?$/, kind: 'babel', understanding: 'understood' },
  { pattern: /(^|\/)postcss\.config\.[mc]?js$/, kind: 'postcss', understanding: 'understood' },
  { pattern: /(^|\/)tailwind\.config\.[mc]?[jt]s$/, kind: 'tailwind', understanding: 'understood' },
  {
    pattern: /(^|\/)nuxt\.config\.[mc]?[jt]s$/,
    kind: 'nuxt-framework',
    understanding: 'listed-only',
  },
  {
    pattern: /(^|\/)svelte\.config\.[mc]?js$/,
    kind: 'svelte-framework',
    understanding: 'listed-only',
  },
  { pattern: /(^|\/)angular\.json$/, kind: 'angular-framework', understanding: 'listed-only' },
  {
    pattern: /(^|\/)next\.config\.[mc]?[jt]s$/,
    kind: 'next-framework',
    understanding: 'listed-only',
  },
  {
    pattern: /(^|\/)astro\.config\.[mc]?[jt]s$/,
    kind: 'astro-framework',
    understanding: 'listed-only',
  },
]

/** Dependency name to framework id. Order is declaration order, never a choice. */
const FRAMEWORK_DEPENDENCIES: readonly (readonly [string, string])[] = [
  ['vue', 'vue'],
  ['nuxt', 'nuxt'],
  ['svelte', 'svelte'],
  ['@sveltejs/kit', 'sveltekit'],
  ['@angular/core', 'angular'],
  ['react', 'react'],
  ['react-dom', 'react'],
  ['next', 'next'],
  ['astro', 'astro'],
  ['solid-js', 'solid'],
  ['@solidjs/start', 'solid'],
  ['@builder.io/qwik', 'qwik'],
  ['lit', 'lit'],
]

const FRAMEWORK_CONFIG_HINTS: Readonly<Record<string, RegExp>> = {
  nuxt: /(^|\/)nuxt\.config\.[mc]?[jt]s$/,
  svelte: /(^|\/)svelte\.config\.[mc]?js$/,
  sveltekit: /(^|\/)svelte\.config\.[mc]?js$/,
  angular: /(^|\/)angular\.json$/,
  next: /(^|\/)next\.config\.[mc]?[jt]s$/,
  astro: /(^|\/)astro\.config\.[mc]?[jt]s$/,
}

/** Dependencies that act as plugins. Discovery lists them, adapters interpret. */
const PLUGIN_DEPENDENCIES: readonly string[] = [
  'vue-router',
  'react-router',
  'react-router-dom',
  '@angular/router',
  'pinia',
  'vuex',
  '@reduxjs/toolkit',
  'react-redux',
  'zustand',
  'mobx',
  'xstate',
  'rxjs',
  '@tanstack/react-query',
  '@tanstack/query-core',
  'vue-i18n',
  'react-i18next',
  'i18next',
]

const NODE_BUILTINS: readonly string[] = [
  'assert',
  'buffer',
  'child_process',
  'crypto',
  'events',
  'fs',
  'http',
  'https',
  'os',
  'path',
  'process',
  'stream',
  'url',
  'util',
  'zlib',
]

const SCRIPT_ENTRY_KEYS: readonly string[] = ['build', 'dev', 'start', 'test', 'preview']

const PACKAGE_ENTRY_FILES: readonly string[] = [
  'index.html',
  'src/main.ts',
  'src/main.tsx',
  'src/main.js',
]

const SOURCE_EXTENSIONS: readonly string[] = [
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.ts',
  '.mts',
  '.cts',
  '.tsx',
  '.vue',
  '.svelte',
]

const KNOWN_ROOT_DIRECTORIES: readonly string[] = [
  'src',
  'public',
  'assets',
  'tests',
  'test',
  'e2e',
  'docs',
  'scripts',
  'packages',
  'apps',
  'libs',
  'tools',
  'config',
  'fixtures',
  'examples',
  '__tests__',
]

const COVERED_AREAS: readonly string[] = [
  'topology',
  'package-manager',
  'lockfiles',
  'resolved-versions',
  'framework-candidates',
  'configs',
  'plugins',
  'build-entries',
  'conventions',
  'escape-hatches',
]

/* Path helpers: repository relative, forward slashes. */

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

function dirname(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? '.' : path.slice(0, index)
}

function packageDirOf(manifestPath: string): string {
  return manifestPath === 'package.json' ? '.' : dirname(manifestPath)
}

function joinPackageDir(dir: string, name: string): string {
  return dir === '.' ? name : `${dir}/${name}`
}

function isUnderGenerated(path: string): boolean {
  return path.split('/').some((segment) => GENERATED_DIRECTORY_NAMES.includes(segment))
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Resolves a relative specifier against the importing file. Null when external. */
function resolveRelative(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const parts = dirname(fromFile).split('/')
  const base: string[] = dirname(fromFile) === '.' ? [] : [...parts]
  for (const segment of specifier.split('/')) {
    if (segment === '.' || segment === '') continue
    if (segment === '..') base.pop()
    else base.push(segment)
  }
  return base.join('/')
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value) as string
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort((left, right) => left.localeCompare(right))
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
  return `{${entries.join(',')}}`
}

/* Reader with call tracking. */

interface TrackingReader {
  readonly files: readonly string[]
  readonly read: (path: string) => string | undefined
  readonly readFiles: Set<string>
  readonly unreadable: string[]
}

function trackReader(reader: DiscoveryReader): TrackingReader {
  const files = reader.files.map(normalizePath).sort((left, right) => left.localeCompare(right))
  const readFiles = new Set<string>()
  const unreadable: string[] = []
  return {
    files,
    readFiles,
    unreadable,
    read: (path: string) => {
      let text: string | undefined
      try {
        text = reader.readText(path)
      } catch {
        text = undefined
      }
      if (text === undefined) {
        if (!unreadable.includes(path)) unreadable.push(path)
        return undefined
      }
      readFiles.add(path)
      return text
    },
  }
}

/* Lockfile version extraction, one honest parser per family. */

function extractPnpmVersion(lockText: string, name: string): string | null {
  const pattern = new RegExp(
    `^\\s{2,}${escapeRegExp(name)}:\\s*\\n\\s+specifier:[^\\n]*\\n\\s+version:\\s*(\\S+)`,
    'm',
  )
  const importer = pattern.exec(lockText)?.[1]
  if (importer !== undefined) return importer.replace(/,$/, '').replace(/^["']|["']$/g, '')
  const snapshot = new RegExp(`^\\s{2}${escapeRegExp(name)}@([^\\s(:]+)`, 'm').exec(lockText)?.[1]
  return snapshot ?? null
}

function extractYarnVersion(lockText: string, name: string): string | null {
  const pattern = new RegExp(
    `^["']?${escapeRegExp(name)}@[^"'\\n]*["']?:\\s*\\n\\s+version\\s*:?\\s*["']?([^\\s"']+)`,
    'm',
  )
  return pattern.exec(lockText)?.[1] ?? null
}

function extractNpmVersion(lockJson: unknown, name: string): string | null {
  if (!isRecord(lockJson)) return null
  const packages = lockJson['packages']
  if (isRecord(packages)) {
    const entry = packages[`node_modules/${name}`]
    if (isRecord(entry) && typeof entry['version'] === 'string') return entry['version']
  }
  const dependencies = lockJson['dependencies']
  if (isRecord(dependencies)) {
    const entry = dependencies[name]
    if (isRecord(entry) && typeof entry['version'] === 'string') return entry['version']
  }
  return null
}

function extractBunVersion(lockText: string, name: string): string | null {
  const parsed = safeJsonParse(lockText)
  if (!isRecord(parsed)) return null
  const packages = parsed['packages']
  if (!isRecord(packages)) return null
  for (const [key, entry] of Object.entries(packages)) {
    if (key === name || key.startsWith(`${name}@`)) {
      if (isRecord(entry) && typeof entry['version'] === 'string') return entry['version']
    }
  }
  return null
}

/* Internal discovery state. */

interface ParsedManifest {
  readonly path: string
  readonly dir: string
  readonly json: Record<string, unknown>
  readonly text: string
}

interface DeclaredDependency {
  readonly packageDir: string
  readonly manifestPath: string
  readonly field: string
  readonly name: string
  readonly range: string
}

const DEPENDENCY_FIELDS: readonly string[] = ['dependencies', 'devDependencies', 'peerDependencies']

function declaredDependencies(manifest: ParsedManifest): DeclaredDependency[] {
  const found: DeclaredDependency[] = []
  for (const field of DEPENDENCY_FIELDS) {
    const group = manifest.json[field]
    if (!isRecord(group)) continue
    for (const [name, range] of Object.entries(group)) {
      if (typeof range !== 'string') continue
      found.push({ packageDir: manifest.dir, manifestPath: manifest.path, field, name, range })
    }
  }
  return found.sort((left, right) =>
    `${left.packageDir}${left.field}${left.name}`.localeCompare(
      `${right.packageDir}${right.field}${right.name}`,
    ),
  )
}

function fact<T>(value: T, location: string, confidence: DiscoveryConfidence): DiscoveryFact<T> {
  return { value, location: { file: location }, confidence }
}

/**
 * Discovers the repository capability manifest from injected files.
 * Never touches the filesystem, the network, or a shell: every observation
 * comes from `reader`.
 */
export function discoverRepository(
  reader: DiscoveryReader,
  options: DiscoverOptions = {},
): RepositoryCapabilityManifest {
  const tracked = trackReader(reader)
  const root = options.root ?? '.'
  const diagnostics: DiscoveryDiagnostic[] = []
  const deltas: DiscoveryDelta[] = []
  const uncovered: string[] = []

  for (const path of tracked.files) {
    if (path.endsWith('package.json') && !isUnderGenerated(path)) tracked.read(path)
  }

  /* Manifests and packages. */

  const manifests: ParsedManifest[] = []
  for (const path of tracked.files) {
    const isManifest = path === 'package.json' || path.endsWith('/package.json')
    if (!isManifest || isUnderGenerated(path)) continue
    const text = tracked.read(path)
    if (text === undefined) continue
    const parsed = safeJsonParse(text)
    if (!isRecord(parsed)) {
      diagnostics.push({
        code: 'unparsed-manifest',
        message: `Manifest ${path} is not valid JSON and is excluded.`,
        severity: 'error',
      })
      continue
    }
    manifests.push({ path, dir: packageDirOf(path), json: parsed, text })
  }
  manifests.sort((left, right) => left.path.localeCompare(right.path))

  for (const path of tracked.unreadable) {
    if (path === 'package.json' || path.endsWith('/package.json')) {
      diagnostics.push({
        code: 'unreadable-file',
        message: `Listed file ${path} could not be read.`,
        severity: 'warning',
      })
      uncovered.push(`file:${path}`)
    }
  }

  const rootManifest = manifests.find((manifest) => manifest.path === 'package.json')
  const manifestHome = rootManifest?.path ?? tracked.files[0] ?? 'package.json'

  const packages: PackageEntry[] = manifests.map((manifest) => {
    const name = typeof manifest.json['name'] === 'string' ? manifest.json['name'] : manifest.dir
    return { name, path: manifest.dir, manifestPath: manifest.path }
  })

  const declared: DeclaredDependency[] = manifests.flatMap(declaredDependencies)
  const declaredNames = new Set(declared.map((entry) => entry.name))

  /* Topology: git roots, workspaces, generated directories, symlinks. */

  const gitRoots = new Set<string>()
  for (const path of tracked.files) {
    if (path === '.git/HEAD' || path.startsWith('.git/')) gitRoots.add('.')
    const marker = '/.git/HEAD'
    if (path === '.git' || path.endsWith(marker) || path.includes('/.git/')) {
      const prefix = path === '.git' ? '.' : path.slice(0, path.indexOf('/.git'))
      gitRoots.add(prefix === '' ? '.' : prefix)
    }
  }
  const gitRootList = [...gitRoots].sort((left, right) => left.localeCompare(right))

  const workspaceDeclarations: WorkspaceDeclaration[] = []
  for (const path of tracked.files) {
    if (isUnderGenerated(path)) continue
    if (path.endsWith('pnpm-workspace.yaml') || path === 'pnpm-workspace.yaml') {
      const text = tracked.read(path) ?? ''
      if (/^\s*packages\s*:/m.test(text)) {
        workspaceDeclarations.push({ kind: 'pnpm-workspace', path })
      } else {
        workspaceDeclarations.push({ kind: 'custom', path })
        diagnostics.push({
          code: 'unparsed-workspace',
          message: `Workspace file ${path} declares no packages list and is not interpreted.`,
          severity: 'warning',
        })
      }
    }
    if (path.endsWith('nx.json') || path === 'nx.json') {
      const text = tracked.read(path)
      if (text !== undefined && safeJsonParse(text) !== undefined) {
        workspaceDeclarations.push({ kind: 'nx', path })
      } else {
        diagnostics.push({
          code: 'unparsed-config',
          message: `Workspace file ${path} is not valid JSON and is not interpreted.`,
          severity: 'warning',
        })
      }
    }
    if (path.endsWith('turbo.json') || path === 'turbo.json') {
      const text = tracked.read(path)
      if (text !== undefined && safeJsonParse(text) !== undefined) {
        workspaceDeclarations.push({ kind: 'turborepo', path })
      } else {
        diagnostics.push({
          code: 'unparsed-config',
          message: `Workspace file ${path} is not valid JSON and is not interpreted.`,
          severity: 'warning',
        })
      }
    }
  }
  for (const manifest of manifests) {
    const workspaces = manifest.json['workspaces']
    const hasWorkspaces =
      (Array.isArray(workspaces) && workspaces.length > 0) ||
      (isRecord(workspaces) && Array.isArray(workspaces['packages']))
    if (hasWorkspaces)
      workspaceDeclarations.push({ kind: 'package-json-workspaces', path: manifest.path })
  }
  workspaceDeclarations.sort((left, right) =>
    `${left.kind}${left.path}`.localeCompare(`${right.kind}${right.path}`),
  )

  const generated = new Map<string, string>()
  for (const path of tracked.files) {
    const segments = path.split('/')
    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index]
      if (segment !== undefined && GENERATED_DIRECTORY_NAMES.includes(segment)) {
        const dir = segments.slice(0, index + 1).join('/')
        if (!generated.has(dir)) generated.set(dir, `contains generated directory "${segment}"`)
      }
    }
  }
  const generatedDirectories: GeneratedDirectory[] = [...generated.entries()]
    .map(([path, reason]) => ({ path, reason }))
    .sort((left, right) => left.path.localeCompare(right.path))

  const symlinksEnumerated = reader.symlinks !== undefined
  const symlinkList = [...(reader.symlinks ?? [])]
    .map(normalizePath)
    .sort((left, right) => left.localeCompare(right))
  if (!symlinksEnumerated) uncovered.push('symlinks')

  /* Package manager and lockfiles. */

  const lockfileHits: {
    readonly manager: Exclude<PackageManagerKind, 'unknown'>
    readonly path: string
  }[] = []
  for (const path of tracked.files) {
    if (isUnderGenerated(path)) continue
    const base = path.split('/').at(-1) ?? path
    const evidence = LOCKFILE_EVIDENCE.find((entry) => entry.file === base)
    if (evidence !== undefined) lockfileHits.push({ manager: evidence.manager, path })
  }
  lockfileHits.sort((left, right) => left.path.localeCompare(right.path))

  let fieldManager: PackageManagerKind = 'unknown'
  if (rootManifest !== undefined) {
    const field = rootManifest.json['packageManager']
    if (typeof field === 'string') {
      const match = PACKAGE_MANAGER_FIELD_PREFIXES.find(([prefix]) => field.startsWith(prefix))
      if (match !== undefined) fieldManager = match[1]
    }
  }
  const yarnrcEvidence = tracked.files.some(
    (path) => !isUnderGenerated(path) && (path === '.yarnrc.yml' || path.endsWith('/.yarnrc.yml')),
  )

  const managerEvidence = new Set<PackageManagerKind>()
  for (const hit of lockfileHits) managerEvidence.add(hit.manager)
  if (fieldManager !== 'unknown') managerEvidence.add(fieldManager)
  if (yarnrcEvidence) managerEvidence.add('yarn')
  if (workspaceDeclarations.some((entry) => entry.kind === 'pnpm-workspace')) {
    managerEvidence.add('pnpm')
  }

  let packageManager: PackageManagerKind = 'unknown'
  let packageManagerConfidence: DiscoveryConfidence = 'unknown'
  let packageManagerLocation = manifestHome
  if (managerEvidence.size === 1) {
    const only = [...managerEvidence][0]
    if (only !== undefined) {
      packageManager = only
      packageManagerConfidence =
        lockfileHits.length > 0 || fieldManager !== 'unknown' ? 'high' : 'medium'
      const hit = lockfileHits.find((entry) => entry.manager === only)
      const workspace = workspaceDeclarations.find(
        (entry) => entry.kind === 'pnpm-workspace' && only === 'pnpm',
      )
      packageManagerLocation = hit?.path ?? workspace?.path ?? rootManifest?.path ?? manifestHome
    }
  } else if (managerEvidence.size > 1) {
    const names = [...managerEvidence].sort((left, right) => left.localeCompare(right)).join(', ')
    diagnostics.push({
      code: 'package-manager-collision',
      message: `Several package managers leave evidence (${names}); no single manager is chosen.`,
      severity: 'error',
    })
    packageManagerLocation = lockfileHits[0]?.path ?? manifestHome
  } else {
    diagnostics.push({
      code: 'package-manager-undeclared',
      message: 'No lockfile, packageManager field or manager config names the package manager.',
      severity: 'warning',
    })
  }

  const lockfiles: LockfileRecord[] = lockfileHits.map((hit) => ({
    manager: hit.manager,
    path: hit.path,
  }))

  /* Resolved versions, from lockfile evidence only. */

  const lockTexts = new Map<string, string>()
  for (const hit of lockfileHits) {
    const text = tracked.read(hit.path)
    if (text !== undefined) lockTexts.set(hit.path, text)
  }

  function resolveVersion(name: string): string | null {
    const relevant = lockfileHits.filter(
      (hit) => packageManager === 'unknown' || hit.manager === packageManager,
    )
    for (const hit of relevant) {
      const text = lockTexts.get(hit.path)
      if (text === undefined) continue
      if (hit.manager === 'pnpm') {
        const version = extractPnpmVersion(text, name)
        if (version !== null) return version
      } else if (hit.manager === 'yarn') {
        const version = extractYarnVersion(text, name)
        if (version !== null) return version
      } else if (hit.manager === 'npm') {
        const version = extractNpmVersion(safeJsonParse(text), name)
        if (version !== null) return version
      } else {
        const version = extractBunVersion(text, name)
        if (version !== null) return version
      }
    }
    return null
  }

  const resolvedVersions: ResolvedVersion[] = declared.map((entry) => ({
    package: entry.packageDir,
    name: entry.name,
    range: entry.range,
    resolved: resolveVersion(entry.name),
  }))

  const unresolvedNames = [
    ...new Set(
      resolvedVersions.filter((entry) => entry.resolved === null).map((entry) => entry.name),
    ),
  ].sort((left, right) => left.localeCompare(right))
  for (const name of unresolvedNames) {
    diagnostics.push({
      code: 'version-unresolved',
      message: `Dependency "${name}" is declared but no lockfile resolves it; the version is not guessed.`,
      severity: 'warning',
    })
  }
  if (lockfileHits.some((hit) => hit.manager === 'bun')) {
    const bunResolved = resolvedVersions.some(
      (entry) => entry.resolved !== null && lockfileHits.some((hit) => hit.manager === 'bun'),
    )
    if (!bunResolved) uncovered.push('bun-lockfile-contents')
  }

  /* Framework candidates: several on ambiguity, never an arbitrary choice. */

  const frameworkCandidates: (FrameworkCandidate & { confidence: DiscoveryConfidence })[] = []
  const frameworkIds = [...new Set(FRAMEWORK_DEPENDENCIES.map(([, id]) => id))].sort(
    (left, right) => left.localeCompare(right),
  )
  for (const framework of frameworkIds) {
    const depNames = FRAMEWORK_DEPENDENCIES.filter(([, id]) => id === framework).map(
      ([name]) => name,
    )
    const declarations = declared.filter((entry) => depNames.includes(entry.name))
    if (declarations.length === 0) continue
    const inDependencies = declarations.some((entry) => entry.field === 'dependencies')
    const ranges = declarations
      .map((entry) => entry.range)
      .sort((left, right) => left.localeCompare(right))
    const versionRange = ranges[0] ?? null
    const majorMatch = versionRange?.match(/(\d+)/)
    const hint = FRAMEWORK_CONFIG_HINTS[framework]
    const hintPath = hint === undefined ? undefined : tracked.files.find((path) => hint.test(path))
    const evidence: string[] = declarations.map(
      (entry) => `"${entry.packageDir}/${entry.field}" declares "${entry.name}" "${entry.range}"`,
    )
    for (const entry of resolvedVersions) {
      if (depNames.includes(entry.name) && entry.resolved !== null) {
        evidence.push(`lockfile resolves "${entry.name}" to ${entry.resolved}`)
      }
    }
    if (hintPath !== undefined) evidence.push(`config "${hintPath}" hints ${framework}`)
    evidence.sort((left, right) => left.localeCompare(right))
    const resolved = declarations.some((entry) =>
      resolvedVersions.some((version) => version.name === entry.name && version.resolved !== null),
    )
    const confidence: DiscoveryConfidence =
      inDependencies && resolved && hintPath !== undefined
        ? 'high'
        : inDependencies
          ? 'medium'
          : 'low'
    frameworkCandidates.push({
      framework,
      versionRange,
      major: majorMatch?.[1] !== undefined ? Number(majorMatch[1]) : null,
      evidence,
      confidence,
    })
  }

  const strongCandidates = frameworkCandidates.filter(
    (candidate) => candidate.confidence === 'high' || candidate.confidence === 'medium',
  )
  if (strongCandidates.length > 1) {
    const names = strongCandidates.map((candidate) => candidate.framework).join(', ')
    diagnostics.push({
      code: 'framework-collision',
      message: `Several frameworks own the repository (${names}); discovery records each candidate and chooses none.`,
      severity: 'error',
    })
  } else if (frameworkCandidates.length > 0 && strongCandidates.length === 0) {
    diagnostics.push({
      code: 'low-confidence-framework',
      message:
        'Framework evidence is weak (dev dependencies only); a person must confirm the owner.',
      severity: 'warning',
    })
  }

  /* Configs, plugins, build entries. */

  const configs: ConfigRecord[] = []
  for (const path of tracked.files) {
    if (isUnderGenerated(path)) continue
    const evidence = CONFIG_EVIDENCE.find((entry) => entry.pattern.test(path))
    if (evidence !== undefined) {
      tracked.read(path)
      configs.push({ path, kind: evidence.kind, understanding: evidence.understanding })
    }
  }
  configs.sort((left, right) => left.path.localeCompare(right.path))

  const plugins: PluginRecord[] = declared
    .filter((entry) => PLUGIN_DEPENDENCIES.includes(entry.name))
    .map((entry) => ({
      name: entry.name,
      range: entry.range,
      package: entry.packageDir,
      understanding: 'listed-only' as ConfigUnderstanding,
    }))

  const buildEntries: BuildEntry[] = []
  const escapeHatches: EscapeHatch[] = []
  let buildScriptBlocked = false

  for (const manifest of manifests) {
    const scripts = manifest.json['scripts']
    if (!isRecord(scripts)) continue
    for (const key of SCRIPT_ENTRY_KEYS) {
      const value = scripts[key]
      if (typeof value !== 'string' || value.trim() === '') continue
      const driver = localBuildDriver(value, manifest.dir)
      const opaque = isOpaqueShell(value)
      if (driver !== null && !isKnownConfigFile(driver)) {
        const seen = tracked.files.includes(driver)
        escapeHatches.push({
          kind: 'custom-build-driver',
          detail: `script "${key}" in ${manifest.path} runs ${seen ? 'uncovered driver' : 'unlisted file'} "${driver}"`,
        })
        if (key === 'build') {
          buildScriptBlocked = true
          diagnostics.push({
            code: 'unsupported-custom-configuration',
            message: `Build script "${key}" in ${manifest.path} runs "${driver}", which no profile covers.`,
            severity: 'error',
          })
        }
      } else if (opaque) {
        escapeHatches.push({
          kind: 'opaque-shell-entry',
          detail: `script "${key}" in ${manifest.path} runs an opaque shell command`,
        })
        if (key === 'build') {
          buildScriptBlocked = true
          diagnostics.push({
            code: 'opaque-build-entry',
            message: `Build script "${key}" in ${manifest.path} is an opaque shell entry, not an entry to follow.`,
            severity: 'error',
          })
        }
      } else {
        buildEntries.push({ name: `script:${key}`, kind: 'script', target: value })
      }
    }
    for (const entryFile of PACKAGE_ENTRY_FILES) {
      const full = joinPackageDir(manifest.dir, entryFile)
      if (tracked.files.includes(full)) {
        tracked.read(full)
        buildEntries.push({ name: `entry:${full}`, kind: 'entry-file', target: full })
      }
    }
  }
  buildEntries.sort((left, right) => left.name.localeCompare(right.name))

  const applications = new Map<string, ApplicationEntry>()
  for (const manifest of manifests) {
    const scripts = isRecord(manifest.json['scripts']) ? manifest.json['scripts'] : {}
    const hasRunnableScript =
      typeof scripts['build'] === 'string' ||
      typeof scripts['dev'] === 'string' ||
      typeof scripts['start'] === 'string'
    const hasEntryFile = PACKAGE_ENTRY_FILES.some((entryFile) =>
      tracked.files.includes(joinPackageDir(manifest.dir, entryFile)),
    )
    if (hasRunnableScript || hasEntryFile) {
      const name = typeof manifest.json['name'] === 'string' ? manifest.json['name'] : manifest.dir
      applications.set(manifest.dir, { name, path: manifest.dir })
    }
  }
  const applicationList = [...applications.values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  )

  /* Content scan for escape hatches, bounded by the injected file list. */

  const importPattern =
    /(?:\bimport\s+(?:[^;'"]*?\bfrom\s+)?|\bexport\s+[^;'"]*?\bfrom\s+|\brequire\s*\(\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]/g
  for (const path of tracked.files) {
    if (isUnderGenerated(path)) continue
    const dot = path.lastIndexOf('.')
    const extension = dot === -1 ? '' : path.slice(dot)
    if (!SOURCE_EXTENSIONS.includes(extension)) continue
    const text = tracked.read(path)
    if (text === undefined) continue
    if (/\beval\s*\(/.test(text) || /\bnew\s+Function\s*\(/.test(text)) {
      escapeHatches.push({ kind: 'eval-use', detail: `${path} uses eval or new Function` })
    }
    if (/import\(\s*(?![`"'])/.test(text)) {
      escapeHatches.push({ kind: 'dynamic-import', detail: `${path} uses a computed import` })
    }
    const owner = manifests
      .filter((manifest) => manifest.dir === '.' || path.startsWith(`${manifest.dir}/`))
      .sort((left, right) => right.dir.length - left.dir.length)[0]
    const ownerDir = owner?.dir ?? '.'
    for (const match of text.matchAll(importPattern)) {
      const specifier = match[1]
      if (specifier === undefined || specifier === '') continue
      if (specifier.startsWith('.')) {
        const resolved = resolveRelative(path, specifier)
        if (
          resolved !== null &&
          ownerDir !== '.' &&
          !resolved.startsWith(`${ownerDir}/`) &&
          resolved !== ownerDir
        ) {
          escapeHatches.push({
            kind: 'cross-boundary-import',
            detail: `${path} imports "${specifier}" outside ${ownerDir}`,
          })
        }
        continue
      }
      if (specifier.startsWith('node:') || NODE_BUILTINS.includes(specifier)) continue
      if (!declaredNames.has(specifier) && !declaredNames.has(specifier.split('/')[0] ?? '')) {
        escapeHatches.push({
          kind: 'unresolved-dependency',
          detail: `${path} imports undeclared "${specifier}"`,
        })
      }
    }
  }
  escapeHatches.sort((left, right) =>
    `${left.kind}${left.detail}`.localeCompare(`${right.kind}${right.detail}`),
  )

  /* Conventions: observed by file shape, never interpreted. */

  const conventions: ConventionRecord[] = []
  for (const path of tracked.files) {
    if (isUnderGenerated(path)) continue
    if (path.endsWith('tsconfig.json') || /tsconfig\.[^/]+\.json$/.test(path)) {
      const text = tracked.read(path)
      const parsed = text === undefined ? undefined : safeJsonParse(text)
      if (
        isRecord(parsed) &&
        isRecord(parsed['compilerOptions']) &&
        parsed['compilerOptions']['paths'] !== undefined
      ) {
        conventions.push({
          name: 'typescript-paths',
          detail: `${path} defines compilerOptions.paths`,
        })
      }
    }
  }
  const testFiles = tracked.files.filter(
    (path) =>
      !isUnderGenerated(path) &&
      (path.endsWith('.test.ts') ||
        path.endsWith('.spec.ts') ||
        path.includes('.test.') ||
        path.includes('.spec.')),
  )
  if (testFiles.length > 0) {
    conventions.push({
      name: 'colocated-tests',
      detail: `${testFiles.length} test files, e.g. ${testFiles[0] as string}`,
    })
  }
  const routeDirs = tracked.files.filter((path) => {
    if (isUnderGenerated(path)) return false
    const segments = path.split('/')
    return (
      segments.some(
        (segment) => segment === 'pages' || segment === 'routes' || segment === 'app',
      ) && SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension))
    )
  })
  if (routeDirs.length > 0) {
    conventions.push({
      name: 'filesystem-routes',
      detail: `${routeDirs.length} source files under pages, routes or app directories`,
    })
  }
  const routerFile = tracked.files.find((path) => {
    if (isUnderGenerated(path)) return false
    const base = path.split('/').at(-1) ?? path
    return (
      /^router\.[mc]?[jt]sx?$/.test(base) ||
      /^routes\.[mc]?[jt]sx?$/.test(base) ||
      /\/router\/index\.[mc]?[jt]sx?$/.test(path)
    )
  })
  if (routerFile !== undefined) {
    conventions.push({ name: 'central-router-file', detail: routerFile })
  }
  conventions.sort((left, right) => left.name.localeCompare(right.name))

  const rootDirs = new Set<string>()
  for (const path of tracked.files) {
    const first = path.split('/')[0]
    if (first !== undefined && path.includes('/') && !first.startsWith('.')) rootDirs.add(first)
  }
  const customConventions: CustomConvention[] = [...rootDirs]
    .filter((dir) => !KNOWN_ROOT_DIRECTORIES.includes(dir))
    .sort((left, right) => left.localeCompare(right))
    .map((dir) => ({ path: dir }))
  if (customConventions.length > 0) {
    uncovered.push(...customConventions.map((entry) => `convention:${entry.path}`))
  }

  /* Selection and classification. */

  let classification: EligibilityClassification = 'eligible'
  let selectedApplication: string | null = null
  let selectedConfidence: DiscoveryConfidence = 'unknown'
  let selectedLocation = manifestHome

  if (manifests.length === 0) {
    classification = 'refused'
    diagnostics.push({
      code: 'no-package-manifest',
      message: 'No package.json is visible; there is nothing to qualify.',
      severity: 'error',
    })
  } else if (options.app !== undefined) {
    const wanted = normalizePath(options.app)
    const match = applicationList.find((entry) => entry.path === wanted)
    const packageMatch = packages.find((entry) => entry.path === wanted)
    if (match !== undefined) {
      selectedApplication = match.path
      selectedConfidence = 'high'
      selectedLocation = joinPackageDir(wanted, 'package.json')
    } else if (packageMatch !== undefined) {
      selectedApplication = packageMatch.path
      selectedConfidence = 'medium'
      selectedLocation = packageMatch.manifestPath
    } else {
      classification = 'refused'
      diagnostics.push({
        code: 'unknown-selected-application',
        message: `Selected application "${wanted}" matches no package in the repository.`,
        severity: 'error',
      })
    }
  } else if (applicationList.length === 1) {
    const only = applicationList[0]
    if (only !== undefined) {
      selectedApplication = only.path
      selectedConfidence = 'high'
      selectedLocation =
        only.path === '.' ? 'package.json' : joinPackageDir(only.path, 'package.json')
    }
  } else if (applicationList.length === 0) {
    classification = 'refused'
    diagnostics.push({
      code: 'no-application',
      message: 'No package has runnable entries; there is no application to transform.',
      severity: 'error',
    })
  }

  if (classification !== 'refused') {
    if (strongCandidates.length > 1 || buildScriptBlocked) {
      classification = 'refused'
    } else if (managerEvidence.size > 1) {
      classification = 'manual-discovery-required'
    } else if (
      selectedApplication === null &&
      applicationList.length > 1 &&
      options.app === undefined
    ) {
      classification = 'manual-discovery-required'
      const names = applicationList.map((entry) => entry.path).join(', ')
      diagnostics.push({
        code: 'multiple-applications',
        message: `Several applications share the repository (${names}); select one with the app option.`,
        severity: 'warning',
      })
    } else if (frameworkCandidates.length > 0 && strongCandidates.length === 0) {
      classification = 'manual-discovery-required'
    }
  }

  /* Deltas: every gap the caller must explicitly accept. */

  if (classification !== 'refused' && classification !== 'manual-discovery-required') {
    if (lockfileHits.length === 0) {
      deltas.push({
        id: 'missing-lockfile',
        description: 'No lockfile is checked in; versions cannot be pinned.',
      })
    }
    if (unresolvedNames.length > 0) {
      deltas.push({
        id: 'unresolved-versions',
        description: `These dependencies resolve to no locked version: ${unresolvedNames.join(', ')}.`,
      })
    }
    if (generatedDirectories.length > 0) {
      deltas.push({
        id: 'generated-directories-excluded',
        description: `Generated directories are excluded from analysis: ${generatedDirectories.map((entry) => entry.path).join(', ')}.`,
      })
    }
    if (!symlinksEnumerated) {
      deltas.push({
        id: 'symlinks-unverified',
        description: 'The caller enumerates no symlinks, so links are unverified.',
      })
    }
    if (customConventions.length > 0) {
      deltas.push({
        id: 'custom-conventions-uninterpreted',
        description: `These layouts are listed but not interpreted: ${customConventions.map((entry) => entry.path).join(', ')}.`,
      })
    }
    if (packageManager === 'unknown') {
      deltas.push({
        id: 'undeclared-package-manager',
        description: 'No evidence names the package manager.',
      })
    }
    if (escapeHatches.length > 0) {
      deltas.push({
        id: 'unreviewed-escape-hatches',
        description: `${escapeHatches.length} escape hatches need review before lowering.`,
      })
    }
    if (deltas.length > 0) classification = 'eligible-with-deltas'
  }

  for (const delta of deltas) {
    diagnostics.push({ code: `delta:${delta.id}`, message: delta.description, severity: 'info' })
  }
  diagnostics.sort((left, right) => left.code.localeCompare(right.code))

  const coverage = {
    covered: [...COVERED_AREAS],
    uncovered: [...new Set(uncovered)].sort((left, right) => left.localeCompare(right)),
  }

  const filesRead = [...tracked.readFiles].sort((left, right) => left.localeCompare(right))

  const withoutHash: Omit<RepositoryCapabilityManifest, 'snapshotHash'> = {
    schemaVersion: REPOSITORY_CAPABILITY_MANIFEST_SCHEMA_VERSION,
    root,
    application: fact(selectedApplication, selectedLocation, selectedConfidence),
    topology: {
      gitRoots: fact(gitRootList, manifestHome, gitRootList.length > 0 ? 'high' : 'unknown'),
      workspaceDeclarations: fact(
        workspaceDeclarations,
        workspaceDeclarations[0]?.path ?? manifestHome,
        workspaceDeclarations.length > 0 ? 'high' : 'unknown',
      ),
      packages: fact(packages, manifestHome, 'high'),
      applications: fact(
        applicationList,
        manifestHome,
        applicationList.length > 0 ? 'medium' : 'unknown',
      ),
      generatedDirectories: fact(generatedDirectories, manifestHome, 'high'),
      symlinks: fact(symlinkList, manifestHome, symlinksEnumerated ? 'high' : 'unknown'),
    },
    packageManager: fact(packageManager, packageManagerLocation, packageManagerConfidence),
    lockfiles: fact(
      lockfiles,
      lockfileHits[0]?.path ?? manifestHome,
      lockfileHits.length > 0 ? 'high' : 'unknown',
    ),
    resolvedVersions: fact(
      resolvedVersions,
      manifestHome,
      unresolvedNames.length === 0 && resolvedVersions.length > 0 ? 'high' : 'low',
    ),
    frameworkCandidates: fact(
      frameworkCandidates,
      manifestHome,
      frameworkCandidates.length === 0
        ? 'unknown'
        : strongCandidates.length === 1
          ? 'high'
          : 'medium',
    ),
    configs: fact(configs, configs[0]?.path ?? manifestHome, 'high'),
    plugins: fact(plugins, manifestHome, 'high'),
    buildEntries: fact(buildEntries, manifestHome, buildEntries.length > 0 ? 'medium' : 'unknown'),
    conventions: fact(conventions, manifestHome, 'high'),
    customConventions: fact(
      customConventions,
      manifestHome,
      customConventions.length > 0 ? 'medium' : 'high',
    ),
    escapeHatches: fact(escapeHatches, manifestHome, 'high'),
    filesRead,
    deltas,
    diagnostics,
    coverage,
    classification,
  }

  return { ...withoutHash, snapshotHash: snapshotHashOf({ ...withoutHash, snapshotHash: '' }) }
}

function localBuildDriver(script: string, packageDir: string): string | null {
  const driverPattern =
    /(?:^|[;&|]\s*)(?:node|tsx|ts-node|jiti|bun|deno)\s+(\.[^\s'"]+\.(?:js|mjs|cjs|ts|mts|cts))|(\.[^\s'"]*\/scripts\/[^\s'"]+)/
  const match = driverPattern.exec(script)
  const relative = match?.[1] ?? match?.[2]
  if (relative === undefined) return null
  const resolved = resolveRelative(joinPackageDir(packageDir, 'package.json'), relative)
  if (resolved === null) return null
  if (packageDir !== '.' && !resolved.startsWith(`${packageDir}/`) && resolved !== packageDir) {
    return resolved
  }
  return resolved
}

function isKnownConfigFile(resolved: string): boolean {
  return CONFIG_EVIDENCE.some((entry) => entry.pattern.test(resolved))
}

function isOpaqueShell(script: string): boolean {
  return (
    /(^|[;&|]\s*|\$\(|`)(curl|wget|ssh|scp|ftp|docker|kubectl|eval|node\s+-e)\b/.test(script) ||
    /[;&|]{1,2}\s*(sh|bash|zsh)\s/.test(script)
  )
}

/** Serializes the canonical form: sorted keys, snapshot hash excluded. */
export function serializeManifest(manifest: RepositoryCapabilityManifest): string {
  const canonical: Record<string, unknown> = { ...manifest }
  delete canonical['snapshotHash']
  return stableStringify(canonical)
}

/** The snapshot hash: hex SHA-256 over the canonical manifest form. */
export function snapshotHashOf(manifest: RepositoryCapabilityManifest): string {
  return createHash('sha256').update(serializeManifest(manifest), 'utf8').digest('hex')
}

/**
 * Whether the manifest may advance to transformation. `eligible` advances;
 * `eligible-with-deltas` advances only when every delta id is accepted;
 * anything else never advances.
 */
export function canAdvance(
  manifest: RepositoryCapabilityManifest,
  acceptedDeltaIds: readonly string[] = [],
): boolean {
  if (manifest.classification === 'eligible') return true
  if (manifest.classification === 'eligible-with-deltas') {
    const accepted = new Set(acceptedDeltaIds)
    return manifest.deltas.every((delta) => accepted.has(delta.id))
  }
  return false
}
