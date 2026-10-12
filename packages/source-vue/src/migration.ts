import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import * as ts from 'typescript'
import type { AppGraph, UnitNode } from '@memolabs-apps/graph'
import type { MigrationDecision, MigrationPlan } from '@memolabs-apps/planner'
import {
  copyMovableUnit,
  runMigration,
  type MigrationReport,
  type MigrationVerificationInput,
  type MigrationVerificationResult,
} from '@memolabs-apps/migrate'
import type { StatePortabilityEvidence } from './state-portability.js'
import { createVueStateVerifier } from './workspace.js'

const PROVIDER_ID = 'vue-state-migration'
const PINIA_VERSION = '4.0.3'
const TYPESCRIPT_VERSION = '6.0.3'
const VERIFICATION_FILE = '.navirox/vue-state-verification.json'
const VERIFICATION_SCHEMA_VERSION = 1
const VERIFIER_MARKER = '__NAVIROX_VUE_STATE_RESULTS__='

export interface VueStateMigrationInput {
  readonly sourceRoot: string
  readonly graph: AppGraph
  readonly plan: MigrationPlan
  readonly readText: (path: string) => string | undefined
  readonly generatedFiles: readonly { readonly path: string; readonly content: string }[]
  readonly workspaceFiles: readonly { readonly path: string; readonly content: string }[]
}

export interface VueStateMigrationResult {
  readonly files: readonly { readonly path: string; readonly content: string }[]
  readonly moved: readonly string[]
  readonly manual: readonly { readonly unit: string; readonly reason: string }[]
  readonly unknown: readonly { readonly unit: string; readonly reason: string }[]
  readonly unresolved: readonly {
    readonly unit: string
    readonly specifier: string
    readonly reason: string
  }[]
  readonly behavior: readonly {
    readonly unit: string
    readonly fixtureId: string
    readonly sourceHash: string
    readonly status: 'passed' | 'failed'
  }[]
}

export interface VueStateMigrationProvider {
  readonly id: string
  readonly migrate: (input: VueStateMigrationInput) => Promise<VueStateMigrationResult>
}

interface CandidateSpec {
  readonly unit: string
  readonly file: string
  readonly profile: StatePortabilityEvidence['profile']
  readonly fixtureId: string
  readonly sourceHash: string
  readonly assertions: readonly {
    readonly expression: string
    readonly expected: string
  }[]
  readonly exportName: string
  readonly sourceBytes: string
}

interface ExecutionResult {
  readonly unit: string
  readonly fixtureId: string
  readonly sourceHash: string
  readonly status: 'passed' | 'failed'
  readonly reason?: string
}

interface VerificationMetadata {
  readonly piniaVersion: string
  readonly verification: string
}

interface VerificationDescriptorUnit {
  readonly unit: string
  readonly file: string
  readonly profile: StatePortabilityEvidence['profile']
  readonly fixtureId: string
  readonly sourceHash: string
  readonly assertions: readonly {
    readonly expression: string
    readonly expected: string
  }[]
  readonly exportName: string
}

interface VerificationResultRecord {
  readonly unit: string
  readonly fixtureId: string
  readonly sourceHash: string
  readonly status: 'passed' | 'failed'
}

interface VerificationDocument {
  readonly schemaVersion: number
  readonly runtime: VerificationMetadata
  readonly descriptor: {
    readonly units: readonly VerificationDescriptorUnit[]
  }
  readonly results: readonly VerificationResultRecord[]
}

type EvidenceInspection =
  | { readonly kind: 'valid'; readonly evidence: StatePortabilityEvidence }
  | { readonly kind: 'missing'; readonly reason: string }
  | { readonly kind: 'malformed'; readonly reason: string }

interface PackageManifest {
  readonly name?: string
  readonly packageManager?: string
  readonly private?: boolean
  readonly type?: string
  readonly scripts?: Record<string, string>
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOwn(value: Record<string, unknown> | undefined, key: string): boolean {
  return value !== undefined && Object.prototype.hasOwnProperty.call(value, key)
}

function validAssertions(value: unknown, requireNonEmpty: boolean): boolean {
  if (!Array.isArray(value) || (requireNonEmpty && value.length === 0)) return false
  return value.every(
    (entry) =>
      isRecord(entry) &&
      typeof entry['expression'] === 'string' &&
      entry['expression'].length > 0 &&
      typeof entry['expected'] === 'string',
  )
}

function validImports(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry['specifier'] === 'string' &&
        entry['specifier'].length > 0 &&
        (entry['status'] === 'allowed' ||
          entry['status'] === 'unresolved' ||
          entry['status'] === 'disallowed'),
    )
  )
}

function validApprovedImports(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        entry['status'] === 'allowed' &&
        (entry['specifier'] === 'vue' || entry['specifier'] === 'pinia'),
    )
  )
}

function evidenceInspection(unit: UnitNode): EvidenceInspection {
  const metadata = unit.metadata
  if (!hasOwn(metadata, 'statePortability')) {
    return { kind: 'missing', reason: 'missing-state-evidence' }
  }

  const value = metadata?.['statePortability']
  if (!isRecord(value)) {
    return { kind: 'malformed', reason: 'invalid-state-evidence: metadata is not an object' }
  }

  const profile = value['profile']
  const status = value['status']
  if (profile !== 'pinia-setup' && profile !== 'composable-pure') {
    return { kind: 'malformed', reason: 'invalid-state-evidence: invalid profile' }
  }
  if (status !== 'approved' && status !== 'manual' && status !== 'unknown') {
    return { kind: 'malformed', reason: 'invalid-state-evidence: invalid status' }
  }
  if (
    typeof value['syntax'] !== 'string' ||
    (profile === 'pinia-setup' && value['syntax'] !== 'defineStore-setup') ||
    (profile === 'composable-pure' && value['syntax'] !== 'exported-useX-composable') ||
    !validImports(value['imports'])
  ) {
    return { kind: 'malformed', reason: 'invalid-state-evidence: invalid imports or syntax' }
  }
  if (
    !Array.isArray(value['effects']) ||
    !value['effects'].every((effect) => typeof effect === 'string')
  ) {
    return { kind: 'malformed', reason: 'invalid-state-evidence: invalid effects' }
  }
  if (
    !Array.isArray(value['blockers']) ||
    !value['blockers'].every((blocker) => typeof blocker === 'string')
  ) {
    return { kind: 'malformed', reason: 'invalid-state-evidence: invalid blockers' }
  }

  if (status === 'approved') {
    if (!validApprovedImports(value['imports'])) {
      return {
        kind: 'malformed',
        reason: 'invalid-state-evidence: approved evidence has imports outside vue and pinia',
      }
    }
    if (value['effects'].length > 0) {
      return {
        kind: 'malformed',
        reason: 'invalid-state-evidence: approved evidence has effects',
      }
    }
  }

  const fixture = value['fixture']
  if (
    !isRecord(fixture) ||
    typeof fixture['id'] !== 'string' ||
    fixture['id'].length === 0 ||
    typeof fixture['sourceHash'] !== 'string' ||
    fixture['sourceHash'].length === 0 ||
    !validAssertions(fixture['assertions'], false)
  ) {
    return { kind: 'malformed', reason: 'invalid-state-evidence: invalid fixture' }
  }
  if (
    fixture['status'] !== 'pending' &&
    fixture['status'] !== 'passed' &&
    fixture['status'] !== 'failed'
  ) {
    return { kind: 'malformed', reason: 'invalid-state-evidence: invalid fixture status' }
  }

  const blockers = value['blockers']
  if (status === 'approved' && blockers.length > 0) {
    return {
      kind: 'malformed',
      reason: `invalid-state-evidence: approved evidence has blockers: ${blockers.join('; ')}`,
    }
  }
  if (status === 'approved' && !validAssertions(fixture['assertions'], true)) {
    return {
      kind: 'malformed',
      reason: 'invalid-state-evidence: approved fixture has no assertions',
    }
  }

  return { kind: 'valid', evidence: value as unknown as StatePortabilityEvidence }
}

function isStateUnit(unit: UnitNode): boolean {
  return unit.kind === 'state-module' || hasOwn(unit.metadata, 'statePortability')
}

function stateEvidence(unit: UnitNode): StatePortabilityEvidence | undefined {
  const inspection = evidenceInspection(unit)
  return inspection.kind === 'valid' ? inspection.evidence : undefined
}

function stateUnits(graph: AppGraph): readonly UnitNode[] {
  return graph.units.filter(isStateUnit)
}

function decisionFor(plan: MigrationPlan, unit: string): MigrationDecision | undefined {
  return plan.decisions.find((decision) => decision.subject === unit)
}

function decisionReason(decision: MigrationDecision | undefined, fallback: string): string {
  if (decision === undefined) return fallback

  const reasons = [
    ...decision.reasons.map((reason) => reason.message),
    ...(decision.blockers ?? []),
  ]

  return reasons.join('; ') || fallback
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) === true
  )
}

function isDefineStoreExpression(node: ts.Expression): boolean {
  return (
    (ts.isIdentifier(node) && node.text === 'defineStore') ||
    (ts.isPropertyAccessExpression(node) && node.name.text === 'defineStore')
  )
}

function exportNameFor(
  content: string,
  profile: StatePortabilityEvidence['profile'],
): string | null {
  const sourceFile = ts.createSourceFile(
    'state.ts',
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const declarations = new Map<string, ts.VariableDeclaration | ts.FunctionDeclaration>()
  const exportedNames = new Map<string, string>()

  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) declarations.set(declaration.name.text, declaration)
      }
      if (hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name))
            exportedNames.set(declaration.name.text, declaration.name.text)
        }
      }
    }

    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      declarations.set(statement.name.text, statement)
      if (hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
        exportedNames.set(statement.name.text, statement.name.text)
      }
    }

    if (ts.isExportDeclaration(statement) && statement.exportClause !== undefined) {
      if (ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          const localName = element.propertyName?.text ?? element.name.text
          exportedNames.set(localName, element.name.text)
        }
      }
    }
  }

  for (const [localName, exportedName] of exportedNames) {
    const declaration = declarations.get(localName)
    if (declaration === undefined) continue
    if (ts.isFunctionDeclaration(declaration)) {
      if (profile === 'composable-pure' && /^use[A-Z]/.test(localName)) return exportedName
      continue
    }
    const initializer = declaration.initializer
    if (
      profile === 'pinia-setup' &&
      initializer !== undefined &&
      ts.isCallExpression(initializer) &&
      isDefineStoreExpression(initializer.expression)
    ) {
      return exportedName
    }
    if (profile === 'composable-pure' && /^use[A-Z]/.test(localName)) return exportedName
  }

  return null
}

function candidateFor(
  unit: UnitNode,
  evidence: StatePortabilityEvidence,
  source: string | undefined,
): CandidateSpec | undefined {
  if (evidence.status !== 'approved' || source === undefined) return undefined
  const exportName = exportNameFor(source, evidence.profile)
  if (exportName === null) return undefined

  return {
    unit: unit.id,
    file: unit.source.file,
    profile: evidence.profile,
    fixtureId: evidence.fixture.id,
    sourceHash: evidence.fixture.sourceHash,
    assertions: evidence.fixture.assertions,
    exportName,
    sourceBytes: source,
  }
}

function candidateRefusalReason(
  unit: UnitNode,
  evidence: StatePortabilityEvidence,
  source: string | undefined,
): string | undefined {
  if (evidence.status !== 'approved') return undefined
  const line = unit.source.start?.line ?? 1
  if (source === undefined) {
    return `unsupported-state-profile ${unit.source.file}:${line} source bytes are unavailable`
  }
  if (exportNameFor(source, evidence.profile) !== null) return undefined
  return `unsupported-state-profile ${unit.source.file}:${line} the approved declaration has no supported exported factory`
}

function safePath(root: string, requested: string): string {
  if (
    requested.length === 0 ||
    /[\u0000-\u001f\u007f]/.test(requested) ||
    /^[A-Za-z][A-Za-z\d+.-]*:/.test(requested) ||
    /^(?:[A-Za-z]:[\\/]|[\\/]{2})/.test(requested) ||
    /[?#]/.test(requested) ||
    /%[0-9A-Fa-f]{2}/.test(requested) ||
    requested.split(/[\\/]/).some((segment) => segment === '.' || segment === '..') ||
    requested.includes('\\')
  ) {
    throw new Error(`The staged file path ${requested} is unsafe.`)
  }
  if (isAbsolute(requested)) {
    throw new Error(`The staged file path ${requested} is absolute.`)
  }

  const target = resolve(root, requested)
  const pathFromRoot = relative(root, target)
  if (
    pathFromRoot.length === 0 ||
    pathFromRoot === '..' ||
    pathFromRoot.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRoot)
  ) {
    throw new Error(`The staged file path ${requested} escapes the temporary workspace.`)
  }

  return target
}

function writeFiles(
  root: string,
  files: readonly { readonly path: string; readonly content: string }[],
): void {
  for (const file of files) {
    const target = safePath(root, file.path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, file.content)
  }
}

function readPackage(root: string): PackageManifest {
  const path = join(root, 'package.json')
  if (!existsSync(path)) {
    return {
      name: 'navirox-state-verification',
      private: true,
      type: 'module',
    }
  }

  return JSON.parse(readFileSync(path, 'utf8')) as PackageManifest
}

function writePackage(root: string, hasPinia: boolean): void {
  const manifest = readPackage(root)
  const dependencies: Record<string, string> = {
    ...(manifest.dependencies ?? {}),
    vue: manifest.dependencies?.['vue'] ?? '3.5.43',
  }
  const devDependencies: Record<string, string> = { ...(manifest.devDependencies ?? {}) }

  if (hasPinia) {
    dependencies['pinia'] = PINIA_VERSION
  }

  devDependencies['typescript'] = TYPESCRIPT_VERSION

  const next: PackageManifest = {
    ...manifest,
    name: manifest.name ?? 'navirox-state-verification',
    packageManager: 'pnpm@11.27.0',
    private: manifest.private ?? true,
    type: manifest.type ?? 'module',
    dependencies,
    devDependencies,
  }

  writeFileSync(join(root, 'package.json'), `${JSON.stringify(next, undefined, 2)}\n`)
}

function mainEntry(root: string, hasPinia: boolean): void {
  if (!hasPinia) return

  const path = join(root, 'src/main.ts')
  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(
      path,
      `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
`,
    )
    return
  }

  let content = readFileSync(path, 'utf8')
  if (!content.includes("from 'pinia'")) {
    content = content.replace(
      /import \{ createApp \} from 'vue'\n/,
      "import { createApp } from 'vue'\nimport { createPinia } from 'pinia'\n",
    )
  }

  if (!content.includes('createPinia()')) {
    const appDeclaration = /const app = createApp\([^\n]+\)\n/
    const match = appDeclaration.exec(content)
    if (match?.[0] !== undefined) {
      content = content.replace(appDeclaration, `${match[0]}app.use(createPinia())\n`)
    }
  }

  writeFileSync(path, content)
}

function verifierSource(specs: readonly CandidateSpec[]): string {
  const descriptors = specs.map((spec) => ({
    unit: spec.unit,
    file: spec.file,
    profile: spec.profile,
    fixtureId: spec.fixtureId,
    sourceHash: spec.sourceHash,
    assertions: spec.assertions,
    exportName: spec.exportName,
  }))

  return `import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const runtime = join(root, '.navirox-state-runtime')
const specs = ${JSON.stringify(descriptors)}
const marker = ${JSON.stringify(VERIFIER_MARKER)}
const results = []

function fail(message) {
  throw new Error(message)
}

function safeSourcePath(requested) {
  if (
    requested.length === 0 ||
    /[\\u0000-\\u001f\\u007f]/.test(requested) ||
    /^[A-Za-z][A-Za-z\\d+.-]*:/.test(requested) ||
    /^(?:[A-Za-z]:[\\\\/]|[\\\\/]{2})/.test(requested) ||
    /[?#]/.test(requested) ||
    /%[0-9A-Fa-f]{2}/.test(requested) ||
    requested.split(/[\\\\/]/).some((segment) => segment === '.' || segment === '..') ||
    requested.includes('\\\\')
  ) {
    fail('state descriptor path is unsafe: ' + requested)
  }
  if (isAbsolute(requested)) fail('state descriptor path is absolute: ' + requested)
  const target = resolve(root, requested)
  const pathFromRoot = relative(root, target)
  if (
    pathFromRoot.length === 0 ||
    pathFromRoot === '..' ||
    pathFromRoot.startsWith('..' + sep) ||
    isAbsolute(pathFromRoot)
  ) {
    fail('state descriptor path escapes the workspace: ' + requested)
  }
  return target
}

function parseExpression(text) {
  const source = ts.createSourceFile('fixture.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  if (source.statements.length !== 1 || !ts.isExpressionStatement(source.statements[0])) {
    fail('fixture expression must contain one expression')
  }
  return source.statements[0].expression
}

function readProperty(value, name) {
  if (value === null || value === undefined) fail('fixture property access has no value')
  if (
    name === '__proto__' ||
    name === 'prototype' ||
    name === 'constructor' ||
    name.startsWith('__') ||
    name === 'toString' ||
    name === 'toJSON' ||
    name === 'valueOf'
  ) {
    fail('fixture property is not allowed')
  }
  if (!Object.prototype.hasOwnProperty.call(Object(value), name)) {
    fail('fixture property is missing: ' + name)
  }
  return value[name]
}

function resolvePath(node, value) {
  if (ts.isParenthesizedExpression(node)) return resolvePath(node.expression, value)
  if (ts.isIdentifier(node)) {
    if (node.text === 'store' || node.text === 'state' || node.text === 'value') {
      return { value, receiver: value }
    }
    return { value: readProperty(value, node.text), receiver: value }
  }
  if (ts.isPropertyAccessExpression(node)) {
    const base = resolvePath(node.expression, value)
    return { value: readProperty(base.value, node.name.text), receiver: base.value }
  }
  fail('fixture expression contains an unsupported path')
}

function literal(node) {
  if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) return node.text
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  if (node.kind === ts.SyntaxKind.NullKeyword) return null
  fail('fixture expression contains an unsupported literal')
}

function evaluateNode(node, value) {
  if (ts.isParenthesizedExpression(node)) return evaluateNode(node.expression, value)
  if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) return resolvePath(node, value).value
  if (ts.isCallExpression(node)) {
    if (node.questionDotToken || node.typeArguments?.length) fail('fixture call is not allowed')
    if (
      ts.isIdentifier(node.expression) &&
      (node.expression.text === 'store' || node.expression.text === 'state' || node.expression.text === 'value')
    ) {
      fail('fixture call target must be a property')
    }
    const member = resolvePath(node.expression, value)
    if (typeof member.value !== 'function') fail('fixture call target is not a function')
    const args = node.arguments.map((argument) => {
      if (ts.isSpreadElement(argument)) fail('fixture spread is not allowed')
      if (
        ts.isIdentifier(argument) ||
        ts.isPropertyAccessExpression(argument) ||
        ts.isParenthesizedExpression(argument) ||
        ts.isStringLiteralLike(argument) ||
        ts.isNumericLiteral(argument) ||
        argument.kind === ts.SyntaxKind.TrueKeyword ||
        argument.kind === ts.SyntaxKind.FalseKeyword ||
        argument.kind === ts.SyntaxKind.NullKeyword
      ) {
        return evaluateNode(argument, value)
      }
      fail('fixture call argument is not simple')
    })
    return member.value.apply(member.receiver, args)
  }
  if (
    ts.isStringLiteralLike(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword
  ) {
    return literal(node)
  }
  fail('fixture expression contains unsupported syntax')
}

function valueText(value) {
  if (value && typeof value === 'object' && value.__v_isRef) {
    return valueText(value.value ?? value._value)
  }
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value === 'bigint') return value.toString() + 'n'
  try {
    const encoded = JSON.stringify(value)
    return encoded === undefined ? String(value) : encoded
  } catch {
    return String(value)
  }
}

function matches(actual, expected) {
  if (valueText(actual) === expected) return true
  try {
    return JSON.stringify(actual) === JSON.stringify(JSON.parse(expected))
  } catch {
    return false
  }
}

mkdirSync(runtime, { recursive: true })
const ts = (await import('typescript')).default
const pinia = specs.some((spec) => spec.profile === 'pinia-setup')
  ? await import('pinia')
  : undefined

for (const [index, descriptor] of specs.entries()) {
  try {
    const sourcePath = safeSourcePath(descriptor.file)
    const targetPath = join(runtime, 'unit-' + index + '.mjs')
    const output = ts.transpileModule(readFileSync(sourcePath, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        verbatimModuleSyntax: false,
      },
      fileName: descriptor.file,
    }).outputText
    writeFileSync(targetPath, output)

    const module = await import(pathToFileURL(targetPath).href)
    const factory = module[descriptor.exportName]
    if (typeof factory !== 'function') fail('the declared factory export is missing')

    let value
    if (descriptor.profile === 'pinia-setup') {
      const active = pinia.createPinia()
      pinia.setActivePinia(active)
      value = factory(active)
    } else {
      value = factory()
    }

    for (const assertion of descriptor.assertions) {
      const actual = await evaluateNode(parseExpression(assertion.expression), value)
      if (!matches(actual, assertion.expected)) {
        fail(
          'assertion ' +
            assertion.expression +
            ' expected ' +
            assertion.expected +
            ' but received ' +
            valueText(actual),
        )
      }
    }

    results.push({
      unit: descriptor.unit,
      fixtureId: descriptor.fixtureId,
      sourceHash: descriptor.sourceHash,
      status: 'passed',
    })
  } catch (error) {
    results.push({
      unit: descriptor.unit,
      fixtureId: descriptor.fixtureId,
      sourceHash: descriptor.sourceHash,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
    })
  }
}

console.log(marker + JSON.stringify(results))
if (results.some((result) => result.status === 'failed')) process.exitCode = 1
`
}

function packageRootFor(entry: string): string {
  let current = dirname(entry)
  while (true) {
    if (existsSync(join(current, 'package.json'))) return current
    const parent = dirname(current)
    if (parent === current) throw new Error(`could not locate the package root for ${entry}`)
    current = parent
  }
}

function linkWorkspaceDependencies(root: string, hasPinia: boolean): string | undefined {
  const require = createRequire(import.meta.url)
  const nodeModules = join(root, 'node_modules')
  const packages = ['vue', 'typescript', ...(hasPinia ? ['pinia'] : [])]

  try {
    mkdirSync(nodeModules, { recursive: true })
    for (const name of packages) {
      const entry = require.resolve(name)
      symlinkSync(packageRootFor(entry), join(nodeModules, name), 'dir')
    }
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

function installWorkspace(root: string): string | undefined {
  const install = spawnSync(
    'corepack',
    ['pnpm', 'install', '--offline', '--ignore-scripts', '--reporter=silent'],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 120_000,
    },
  )

  if (install.status === 0) return undefined
  return (
    install.error?.message ?? install.stderr?.trim() ?? 'the temporary workspace install failed'
  )
}

function readVerificationMetadata(root: string): VerificationMetadata | undefined {
  const path = join(root, VERIFICATION_FILE)
  if (!existsSync(path)) return undefined

  try {
    const document = JSON.parse(readFileSync(path, 'utf8')) as Partial<VerificationDocument>
    const runtime = document.runtime
    if (
      document.schemaVersion !== VERIFICATION_SCHEMA_VERSION ||
      !isRecord(runtime) ||
      runtime['piniaVersion'] !== PINIA_VERSION ||
      typeof runtime['verification'] !== 'string' ||
      runtime['verification'].trim().length === 0
    ) {
      return undefined
    }
    return {
      piniaVersion: runtime['piniaVersion'],
      verification: runtime['verification'],
    }
  } catch {
    return undefined
  }
}

function sourceHashOf(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function failedResults(
  specs: readonly CandidateSpec[],
  reason: string,
): readonly ExecutionResult[] {
  return specs.map((spec) => ({
    unit: spec.unit,
    fixtureId: spec.fixtureId,
    sourceHash: spec.sourceHash,
    status: 'failed',
    reason,
  }))
}

function stagedSourceMatches(root: string, specs: readonly CandidateSpec[]): boolean {
  return specs.every((spec) => {
    if (sourceHashOf(spec.sourceBytes) !== spec.sourceHash) return false
    try {
      return readFileSync(safePath(root, spec.file), 'utf8') === spec.sourceBytes
    } catch {
      return false
    }
  })
}

function normalizeExecutionResults(
  root: string,
  raw: unknown,
  specs: readonly CandidateSpec[],
): readonly ExecutionResult[] {
  if (!Array.isArray(raw))
    return failedResults(specs, 'the state verifier returned an invalid result')

  const byUnit = new Map<string, Partial<ExecutionResult>>()
  let invalid = false
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry['unit'] !== 'string' || byUnit.has(entry['unit'])) {
      invalid = true
      continue
    }
    if (!specs.some((spec) => spec.unit === entry['unit'])) {
      invalid = true
      continue
    }
    byUnit.set(entry['unit'], entry as Partial<ExecutionResult>)
  }

  if (byUnit.size !== specs.length) invalid = true
  if (invalid)
    return failedResults(specs, 'the state verifier result did not match the candidate set')

  return specs.map((spec) => {
    const result = byUnit.get(spec.unit)
    if (
      result === undefined ||
      result.fixtureId !== spec.fixtureId ||
      result.sourceHash !== spec.sourceHash ||
      (result.status !== 'passed' && result.status !== 'failed')
    ) {
      return {
        unit: spec.unit,
        fixtureId: spec.fixtureId,
        sourceHash: spec.sourceHash,
        status: 'failed',
        reason: 'the state verifier result did not match the candidate evidence',
      }
    }

    if (sourceHashOf(spec.sourceBytes) !== spec.sourceHash) {
      return {
        unit: spec.unit,
        fixtureId: spec.fixtureId,
        sourceHash: spec.sourceHash,
        status: 'failed',
        reason: 'the source hash does not match the staged source snapshot',
      }
    }

    if (result.status === 'passed') {
      try {
        const staged = readFileSync(safePath(root, spec.file), 'utf8')
        if (staged !== spec.sourceBytes) {
          return {
            unit: spec.unit,
            fixtureId: spec.fixtureId,
            sourceHash: spec.sourceHash,
            status: 'failed',
            reason: 'the verifier changed or deleted staged source bytes',
          }
        }
      } catch {
        return {
          unit: spec.unit,
          fixtureId: spec.fixtureId,
          sourceHash: spec.sourceHash,
          status: 'failed',
          reason: 'the verifier changed or deleted staged source bytes',
        }
      }
    }

    return {
      unit: spec.unit,
      fixtureId: spec.fixtureId,
      sourceHash: spec.sourceHash,
      status: result.status,
      ...(typeof result.reason === 'string' ? { reason: result.reason } : {}),
    }
  })
}

function verificationDocument(
  metadata: VerificationMetadata,
  specs: readonly CandidateSpec[],
  results: readonly ExecutionResult[],
): string {
  const document: VerificationDocument = {
    schemaVersion: VERIFICATION_SCHEMA_VERSION,
    runtime: metadata,
    descriptor: {
      units: specs.map((spec) => ({
        unit: spec.unit,
        file: spec.file,
        profile: spec.profile,
        fixtureId: spec.fixtureId,
        sourceHash: spec.sourceHash,
        assertions: spec.assertions,
        exportName: spec.exportName,
      })),
    },
    results: results.map((result) => ({
      unit: result.unit,
      fixtureId: result.fixtureId,
      sourceHash: result.sourceHash,
      status: result.status,
    })),
  }

  return `${JSON.stringify(document, undefined, 2)}\n`
}

function verificationDocumentMatches(
  root: string,
  metadata: VerificationMetadata,
  specs: readonly CandidateSpec[],
  results: readonly ExecutionResult[],
): boolean {
  try {
    return (
      readFileSync(join(root, VERIFICATION_FILE), 'utf8') ===
      verificationDocument(metadata, specs, results)
    )
  } catch {
    return false
  }
}

function runWorkspaceVerifier(root: string): string | undefined {
  const path = join(root, 'scripts/verify-state.mjs')
  if (!existsSync(path)) return 'the generated workspace state verifier is missing'
  const execution = spawnSync(process.execPath, [path], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
  })
  if (execution.status === 0) return undefined
  return (
    execution.error?.message ??
    execution.stderr?.trim() ??
    'the generated workspace state verifier refused the result'
  )
}

function executeFixtures(
  root: string,
  specs: readonly CandidateSpec[],
  metadata: VerificationMetadata | undefined,
): readonly ExecutionResult[] {
  if (specs.length === 0) return []
  const hasPinia = specs.some((spec) => spec.profile === 'pinia-setup')
  const effectiveMetadata = hasPinia ? metadata : undefined
  if (effectiveMetadata === undefined && hasPinia) {
    return failedResults(
      specs,
      'the generated workspace verification metadata is missing or invalid',
    )
  }

  try {
    writePackage(root, hasPinia)
    mainEntry(root, hasPinia)
    const verifierPath = join(root, 'scripts/provider-verify-state.mjs')
    mkdirSync(dirname(verifierPath), { recursive: true })
    writeFileSync(verifierPath, verifierSource(specs))
    if (effectiveMetadata !== undefined) {
      writeFileSync(
        join(root, 'scripts/verify-state.mjs'),
        createVueStateVerifier(effectiveMetadata),
      )
    }
    const linkFailure = linkWorkspaceDependencies(root, hasPinia)
    if (linkFailure !== undefined) {
      rmSync(join(root, 'node_modules'), { force: true, recursive: true })
      const installFailure = installWorkspace(root)
      if (installFailure !== undefined) return failedResults(specs, installFailure)
    }

    const execution = spawnSync(process.execPath, [verifierPath], {
      cwd: root,
      encoding: 'utf8',
      timeout: 120_000,
    })
    const output = `${execution.stdout ?? ''}\n${execution.stderr ?? ''}`
    const markerAt = output.lastIndexOf(VERIFIER_MARKER)
    if (markerAt === -1) {
      return failedResults(
        specs,
        execution.error?.message ??
          execution.stderr?.trim() ??
          'the state verifier did not report results',
      )
    }

    const encoded = output.slice(markerAt + VERIFIER_MARKER.length).split('\n', 1)[0] ?? ''
    const normalized = normalizeExecutionResults(root, JSON.parse(encoded) as unknown, specs)
    if (normalized.some((result) => result.status === 'failed')) return normalized
    if (execution.status !== 0) {
      return failedResults(
        specs,
        `the state verifier exited with status ${String(execution.status)}`,
      )
    }

    if (effectiveMetadata !== undefined) {
      writeFileSync(
        join(root, VERIFICATION_FILE),
        verificationDocument(effectiveMetadata, specs, normalized),
      )
      writeFileSync(
        join(root, 'scripts/verify-state.mjs'),
        createVueStateVerifier(effectiveMetadata),
      )
      const workspaceFailure = runWorkspaceVerifier(root)
      if (workspaceFailure !== undefined) return failedResults(specs, workspaceFailure)
      if (!verificationDocumentMatches(root, effectiveMetadata, specs, normalized)) {
        return failedResults(specs, 'the workspace verifier changed the state verification result')
      }
    }
    if (!stagedSourceMatches(root, specs)) {
      return failedResults(specs, 'the verifier changed or deleted staged source bytes')
    }
    return normalized
  } catch (error) {
    return failedResults(specs, error instanceof Error ? error.message : String(error))
  }
}

function verificationResult(
  input: MigrationVerificationInput,
  specs: readonly CandidateSpec[],
  metadata: VerificationMetadata | undefined,
): MigrationVerificationResult {
  const byUnit = new Map(specs.map((spec) => [spec.unit, spec]))
  const selected = input.report.moved
    .map((unit) => byUnit.get(unit))
    .filter((spec): spec is CandidateSpec => spec !== undefined)

  if (selected.length !== input.report.moved.length) {
    return {
      passedUnitIds: [],
      failedUnitIds: [...input.report.moved],
      fixtureIds: input.report.moved.map(
        (unit) => byUnit.get(unit)?.fixtureId ?? 'unknown-fixture',
      ),
      sourceHashes: Object.fromEntries(
        input.report.moved.map((unit) => [unit, byUnit.get(unit)?.sourceHash ?? 'unknown-source']),
      ),
    }
  }

  const executed = executeFixtures(input.outputRoot, selected, metadata)
  const passed = executed.filter((result) => result.status === 'passed')
  const failed = executed.filter((result) => result.status === 'failed')

  return {
    passedUnitIds: passed.map((result) => result.unit),
    failedUnitIds: failed.map((result) => result.unit),
    fixtureIds: [...passed, ...failed].map((result) => result.fixtureId),
    sourceHashes: Object.fromEntries(executed.map((result) => [result.unit, result.sourceHash])),
  }
}

function reportFiles(
  report: MigrationReport,
  outputRoot: string,
  specs: readonly CandidateSpec[],
  includeVerification: boolean,
): readonly { readonly path: string; readonly content: string }[] {
  const moved = new Set(report.moved)
  const byPath = new Map<string, string>()
  const byUnit = new Map(specs.map((spec) => [spec.unit, spec]))

  for (const file of report.files) {
    const spec = byUnit.get(file.unit)
    if (!moved.has(file.unit) || spec === undefined) continue
    byPath.set(file.to, spec.sourceBytes)
  }

  if (includeVerification && report.moved.length > 0) {
    const verificationPath = join(outputRoot, VERIFICATION_FILE)
    if (existsSync(verificationPath)) {
      byPath.set(VERIFICATION_FILE, readFileSync(verificationPath, 'utf8'))
    }
  }

  return [...byPath.entries()]
    .map(([path, content]) => ({ path, content }))
    .sort((left, right) => left.path.localeCompare(right.path))
}

function outcomeForUnit(
  unit: UnitNode,
  decision: MigrationDecision | undefined,
): { readonly kind: 'manual' | 'unknown'; readonly reason: string } | undefined {
  const inspection = evidenceInspection(unit)
  if (inspection.kind !== 'valid') {
    return {
      kind: decision?.classification === 'unknown' ? 'unknown' : 'manual',
      reason: inspection.reason,
    }
  }

  const evidence = inspection.evidence
  const fallback = evidence.blockers.join('; ') || 'the Vue state evidence is not approved'
  const reason = decisionReason(decision, fallback)
  if (evidence.status === 'unknown' || decision?.classification === 'unknown') {
    return { kind: 'unknown', reason }
  }
  if (evidence.status === 'manual' || decision?.classification === 'manual') {
    return { kind: 'manual', reason }
  }
  return undefined
}

function unresolvedImports(
  unit: UnitNode,
): readonly { readonly specifier: string; readonly status: string }[] {
  const inspection = evidenceInspection(unit)
  if (inspection.kind === 'valid') return inspection.evidence.imports
  const value = unit.metadata?.['statePortability']
  if (!isRecord(value) || !Array.isArray(value['imports'])) return []
  return value['imports'].filter(
    (entry): entry is { readonly specifier: string; readonly status: string } =>
      isRecord(entry) &&
      typeof entry['specifier'] === 'string' &&
      typeof entry['status'] === 'string',
  )
}

function resultUnresolved(
  input: VueStateMigrationInput,
  report: MigrationReport,
): readonly { readonly unit: string; readonly specifier: string; readonly reason: string }[] {
  const state = stateUnits(input.graph)
  const stateIds = new Set(state.map((unit) => unit.id))
  const records = report.unresolved
    .filter((entry) => stateIds.has(entry.unit))
    .map((entry) => ({
      unit: entry.unit,
      specifier: entry.specifier,
      reason: entry.reason,
    }))
  const seen = new Set(records.map((entry) => `${entry.unit}\u0000${entry.specifier}`))

  for (const unit of state) {
    for (const imported of unresolvedImports(unit)) {
      if (imported.status !== 'unresolved') continue
      const key = `${unit.id}\u0000${imported.specifier}`
      if (seen.has(key)) continue
      seen.add(key)
      records.push({
        unit: unit.id,
        specifier: imported.specifier,
        reason: 'the source state import is not in the closed portable profile',
      })
    }
  }

  return records.sort(
    (left, right) =>
      left.unit.localeCompare(right.unit) || left.specifier.localeCompare(right.specifier),
  )
}

function finalResult(
  input: VueStateMigrationInput,
  report: MigrationReport,
  outputRoot: string,
  specs: readonly CandidateSpec[],
  candidateRefusals: ReadonlyMap<string, string>,
  includeVerification: boolean,
): VueStateMigrationResult {
  const state = stateUnits(input.graph)
  const stateIds = new Set(state.map((unit) => unit.id))
  const manual = report.manual
    .filter((entry) => stateIds.has(entry.unit))
    .map((entry) => ({ unit: entry.unit, reason: entry.reason }))
  const unknown = report.unknown
    .filter((entry) => stateIds.has(entry.unit))
    .map((entry) => ({ unit: entry.unit, reason: entry.reason }))
  const existingManual = new Set(manual.map((entry) => entry.unit))
  const existingUnknown = new Set(unknown.map((entry) => entry.unit))

  for (const unit of state) {
    const outcome = outcomeForUnit(unit, decisionFor(input.plan, unit.id))
    if (outcome === undefined) continue
    const target = outcome.kind === 'manual' ? manual : unknown
    const seen = outcome.kind === 'manual' ? existingManual : existingUnknown
    const existing = target.find((entry) => entry.unit === unit.id)
    if (existing !== undefined) {
      if (evidenceInspection(unit).kind !== 'valid') existing.reason = outcome.reason
      continue
    }
    seen.add(unit.id)
    target.push({ unit: unit.id, reason: outcome.reason })
  }

  for (const [unitId, reason] of candidateRefusals) {
    const existingManualEntry = manual.find((entry) => entry.unit === unitId)
    if (existingManualEntry !== undefined) {
      existingManualEntry.reason = reason
      continue
    }
    const unknownIndex = unknown.findIndex((entry) => entry.unit === unitId)
    if (unknownIndex !== -1) {
      unknown.splice(unknownIndex, 1)
      existingUnknown.delete(unitId)
    }
    existingManual.add(unitId)
    manual.push({ unit: unitId, reason })
  }

  const behaviorUnits = new Set(report.behavior.map((entry) => entry.unit))
  for (const skipped of report.skipped) {
    if (!stateIds.has(skipped.unit) || behaviorUnits.has(skipped.unit)) continue
    const unit = input.graph.units.find((candidate) => candidate.id === skipped.unit)
    if (unit === undefined) continue
    const inspection = evidenceInspection(unit)
    if (inspection.kind !== 'valid' || inspection.evidence.status !== 'approved') continue
    if (existingManual.has(skipped.unit)) continue
    existingManual.add(skipped.unit)
    manual.push({ unit: skipped.unit, reason: skipped.reason })
  }

  return {
    files: reportFiles(report, outputRoot, specs, includeVerification),
    moved: [...report.moved].sort(),
    manual: manual.sort((left, right) => left.unit.localeCompare(right.unit)),
    unknown: unknown.sort((left, right) => left.unit.localeCompare(right.unit)),
    unresolved: resultUnresolved(input, report),
    behavior: report.behavior
      .filter((entry) => stateIds.has(entry.unit))
      .map((entry) => ({ ...entry }))
      .sort((left, right) => left.unit.localeCompare(right.unit)),
  }
}

export function createVueStateMigrationProvider(): VueStateMigrationProvider {
  return {
    id: PROVIDER_ID,
    migrate: async (input: VueStateMigrationInput): Promise<VueStateMigrationResult> => {
      const temporaryRoot = mkdtempSync(join(tmpdir(), 'navirox-vue-state-'))
      const outputRoot = join(temporaryRoot, 'output')
      mkdirSync(outputRoot, { recursive: true })

      try {
        const state = stateUnits(input.graph)
        for (const unit of state) safePath(outputRoot, unit.source.file)

        writeFiles(outputRoot, input.generatedFiles)
        writeFiles(outputRoot, input.workspaceFiles)

        const stateIds = new Set(state.map((unit) => unit.id))
        const stableSources = new Map<string, string | undefined>()
        for (const unit of state) {
          stableSources.set(unit.source.file, input.readText(unit.source.file))
        }
        const readStableText = (path: string): string | undefined =>
          stableSources.has(path) ? stableSources.get(path) : input.readText(path)
        const candidateRefusals = new Map<string, string>()
        const candidates = state
          .map((unit) => {
            const evidence = stateEvidence(unit)
            if (evidence === undefined) return undefined
            const source = readStableText(unit.source.file)
            const candidate = candidateFor(unit, evidence, source)
            if (candidate !== undefined) return candidate
            const refusal = candidateRefusalReason(unit, evidence, source)
            if (refusal !== undefined) candidateRefusals.set(unit.id, refusal)
            return undefined
          })
          .filter((spec): spec is CandidateSpec => spec !== undefined)
        const candidateIds = new Set(candidates.map((spec) => spec.unit))
        const plan = {
          ...input.plan,
          decisions: input.plan.decisions.filter((decision) => {
            if (!stateIds.has(decision.subject)) return false
            const unit = state.find((candidate) => candidate.id === decision.subject)
            if (unit === undefined) return false
            const inspection = evidenceInspection(unit)
            if (inspection.kind !== 'valid') return false
            if (decision.classification === 'shared' || decision.classification === 'portable') {
              return inspection.evidence.status === 'approved' && candidateIds.has(decision.subject)
            }
            return true
          }),
        }
        const graph = { ...input.graph, units: state }
        const verifierSpecs = new Map(candidates.map((spec) => [spec.unit, spec]))
        const metadata = readVerificationMetadata(outputRoot)
        const includeVerification =
          candidates.some((spec) => spec.profile === 'pinia-setup') && metadata !== undefined

        const report = runMigration({
          graph,
          plan,
          adapterId: input.graph.source.adapterId,
          sourceRoot: input.sourceRoot,
          outputRoot,
          write: true,
          readText: readStableText,
          transforms: [copyMovableUnit],
          verify: ({ report: verifierReport, outputRoot: verifierRoot }) =>
            verificationResult(
              verifierInput(verifierReport, verifierRoot),
              [...verifierSpecs.values()],
              metadata,
            ),
        })

        return finalResult(
          input,
          report,
          outputRoot,
          candidates,
          candidateRefusals,
          includeVerification,
        )
      } finally {
        rmSync(temporaryRoot, { force: true, recursive: true })
      }
    },
  }
}

function verifierInput(report: MigrationReport, outputRoot: string): MigrationVerificationInput {
  return { report, outputRoot }
}
