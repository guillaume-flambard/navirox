import { createHash } from 'node:crypto'
import * as ts from 'typescript'

export type StatePortabilityProfile = 'pinia-setup' | 'composable-pure'
export type StatePortabilityStatus = 'approved' | 'manual' | 'unknown'
export type BehaviorStatus = 'pending' | 'passed' | 'failed'

export interface StatePortabilityFixtureSpec {
  readonly id: string
  readonly assertions: readonly {
    readonly expression: string
    readonly expected: string
  }[]
}

export interface StatePortabilityEvidence {
  readonly profile: StatePortabilityProfile
  readonly syntax: string
  readonly imports: readonly {
    readonly specifier: string
    readonly status: 'allowed' | 'unresolved' | 'disallowed'
  }[]
  readonly effects: readonly string[]
  readonly fixture: {
    readonly id: string
    readonly sourceHash: string
    readonly status: BehaviorStatus
    readonly assertions: readonly {
      readonly expression: string
      readonly expected: string
    }[]
  }
  readonly status: StatePortabilityStatus
  readonly blockers: readonly string[]
}

type ImportStatus = StatePortabilityEvidence['imports'][number]['status']
type EffectName = 'async' | 'dom' | 'network' | 'plugin' | 'storage' | 'subscription' | 'timer'

interface ImportFact {
  readonly specifier: string
  readonly status: ImportStatus
  readonly node: ts.Node
  readonly dynamic: boolean
}

interface SourceFacts {
  readonly sourceFile: ts.SourceFile
  readonly imports: readonly ImportFact[]
  readonly defineStoreNames: ReadonlySet<string>
  readonly unverifiedDefineStoreNames: ReadonlySet<string>
  readonly defineStoreNamespaces: ReadonlySet<string>
}

interface Candidate {
  readonly profile: StatePortabilityProfile
  readonly syntax: string
  readonly node: ts.Node
  readonly body?: ts.Node
}

interface ComposableDeclaration {
  readonly node: ts.Node
  readonly body?: ts.Node
}

interface FixtureResult {
  readonly spec?: StatePortabilityFixtureSpec
  readonly blocker?: 'missing-behavior-fixture' | 'invalid-behavior-fixture'
  readonly id: string
  readonly assertions: readonly {
    readonly expression: string
    readonly expected: string
  }[]
}

const ALLOWED_IMPORTS = new Set(['vue', 'pinia'])
const EFFECT_ORDER: readonly EffectName[] = [
  'async',
  'dom',
  'network',
  'plugin',
  'storage',
  'subscription',
  'timer',
]
const NETWORK_NAMES = new Set([
  'fetch',
  'XMLHttpRequest',
  'axios',
  'sendBeacon',
  'WebSocket',
  'request',
])
const STORAGE_NAMES = new Set([
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'Storage',
  'getItem',
  'setItem',
  'removeItem',
])
const STORAGE_ROOTS = new Set(['indexedDB', 'localStorage', 'sessionStorage'])
const TIMER_NAMES = new Set([
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'queueMicrotask',
])
const SUBSCRIPTION_NAMES = new Set([
  'subscribe',
  'unsubscribe',
  'watch',
  'watchEffect',
  'addEventListener',
  'removeEventListener',
  'onMounted',
  'onUnmounted',
  'onScopeDispose',
])
const PLUGIN_NAMES = new Set(['createPlugin', 'registerPlugin', 'installPlugin', 'usePlugin'])
const ASYNC_NAMES = new Set(['Promise'])
const DOM_WRITE_PROPERTIES = new Set([
  'className',
  'innerHTML',
  'innerText',
  'outerHTML',
  'scrollLeft',
  'scrollTop',
  'textContent',
  'title',
])
const DOM_WRITE_METHODS = new Set([
  'add',
  'append',
  'appendChild',
  'insertAdjacentHTML',
  'remove',
  'removeAttribute',
  'removeChild',
  'replace',
  'replaceChildren',
  'setAttribute',
  'toggle',
  'write',
  'writeln',
])
const DOM_ROOTS = new Set(['body', 'document', 'element', 'root', 'window'])
const REFUSAL_CODES = new Set([
  'unsupported-state-profile',
  'unsupported-state-effect',
  'unsupported-state-import',
  'relative-state-import',
  'missing-behavior-fixture',
  'invalid-behavior-fixture',
  'unresolved-state-import',
  'dynamic-state-import',
])

function sourceFileFor(file: string, text: string): ts.SourceFile {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function moduleSpecifierText(node: ts.Node, sourceFile: ts.SourceFile): string {
  return ts.isStringLiteralLike(node) ? node.text : node.getText(sourceFile)
}

function importStatus(specifier: string): ImportStatus {
  if (ALLOWED_IMPORTS.has(specifier)) {
    return 'allowed'
  }

  if (specifier.startsWith('.')) {
    return 'disallowed'
  }

  if (
    specifier.startsWith('/') ||
    specifier.startsWith('@/') ||
    specifier.startsWith('~') ||
    specifier.startsWith('#')
  ) {
    return 'unresolved'
  }

  return 'disallowed'
}

function isTypeOnly(
  node: ts.ImportClause | ts.NamedImportBindings | ts.ImportSpecifier | ts.NamespaceImport,
): boolean {
  return 'isTypeOnly' in node && node.isTypeOnly === true
}

function collectFacts(file: string, text: string): SourceFacts {
  const sourceFile = sourceFileFor(file, text)
  const imports: ImportFact[] = []
  const defineStoreNames = new Set<string>()
  const unverifiedDefineStoreNames = new Set<string>()
  const defineStoreNamespaces = new Set<string>()

  const addImport = (node: ts.Node, specifier: string, dynamic = false): void => {
    imports.push({
      specifier,
      status: dynamic ? 'unresolved' : importStatus(specifier),
      node,
      dynamic,
    })
  }

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteralLike(statement.moduleSpecifier)) {
      const specifier = statement.moduleSpecifier.text
      addImport(statement, specifier)

      const clause = statement.importClause
      if (clause?.namedBindings !== undefined && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          if (
            !isTypeOnly(element) &&
            (element.propertyName?.text ?? element.name.text) === 'defineStore'
          ) {
            unverifiedDefineStoreNames.add(element.name.text)
          }
        }
      }

      if (specifier !== 'pinia' || clause === undefined) {
        continue
      }

      if (clause.name !== undefined) {
        continue
      }

      const bindings = clause.namedBindings
      if (bindings === undefined) {
        continue
      }

      if (ts.isNamespaceImport(bindings)) {
        if (!isTypeOnly(bindings)) {
          defineStoreNamespaces.add(bindings.name.text)
        }
        continue
      }

      if (!isTypeOnly(bindings)) {
        for (const element of bindings.elements) {
          if (
            !isTypeOnly(element) &&
            (element.propertyName?.text ?? element.name.text) === 'defineStore'
          ) {
            defineStoreNames.add(element.name.text)
          }
        }
      }
    }

    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier !== undefined) {
      addImport(statement, moduleSpecifierText(statement.moduleSpecifier, sourceFile))
    }
  }

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const argument = node.arguments[0]
      addImport(
        node,
        argument === undefined ? '<dynamic>' : moduleSpecifierText(argument, sourceFile),
        true,
      )
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  const uniqueImports = imports.filter(
    (candidate, index, all) =>
      all.findIndex(
        (other) => other.specifier === candidate.specifier && other.dynamic === candidate.dynamic,
      ) === index,
  )

  return {
    sourceFile,
    imports: uniqueImports,
    defineStoreNames,
    unverifiedDefineStoreNames,
    defineStoreNamespaces,
  }
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) === true
  )
}

function isExported(node: ts.Node): boolean {
  return (
    hasModifier(node, ts.SyntaxKind.ExportKeyword) ||
    hasModifier(node, ts.SyntaxKind.DefaultKeyword)
  )
}

function isUseName(name: string): boolean {
  return /^use[A-Z]/.test(name)
}

function functionBody(
  expression: ts.Expression | undefined,
  sourceFile: ts.SourceFile,
): ts.Node | undefined {
  if (
    expression !== undefined &&
    (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression))
  ) {
    return expression.body
  }

  if (expression === undefined || !ts.isIdentifier(expression)) {
    return undefined
  }

  const name = expression.text
  let result: ts.Node | undefined

  const visit = (node: ts.Node): void => {
    if (result !== undefined) {
      return
    }

    if (ts.isFunctionDeclaration(node) && node.name?.text === name && node.body !== undefined) {
      result = node.body
      return
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      const initializer = node.initializer
      if (
        initializer !== undefined &&
        (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
      ) {
        result = initializer.body
        return
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return result
}

function isDefineStoreCall(node: ts.CallExpression, facts: SourceFacts): boolean {
  return (
    (ts.isIdentifier(node.expression) &&
      (node.expression.text === 'defineStore' ||
        facts.unverifiedDefineStoreNames.has(node.expression.text))) ||
    (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'defineStore')
  )
}

function defineStoreComesFromPinia(node: ts.CallExpression, facts: SourceFacts): boolean {
  if (ts.isIdentifier(node.expression)) {
    return facts.defineStoreNames.has(node.expression.text)
  }

  return (
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    facts.defineStoreNamespaces.has(node.expression.expression.text) &&
    node.expression.name.text === 'defineStore'
  )
}

function findStoreCandidate(facts: SourceFacts): Candidate | undefined {
  let result: Candidate | undefined

  const visit = (node: ts.Node): void => {
    if (result !== undefined) {
      return
    }

    if (ts.isCallExpression(node) && isDefineStoreCall(node, facts)) {
      const fromPinia = defineStoreComesFromPinia(node, facts)
      const id = node.arguments[0]
      const body = functionBody(node.arguments[1], facts.sourceFile)
      const setup =
        fromPinia &&
        node.arguments.length === 2 &&
        id !== undefined &&
        ts.isStringLiteralLike(id) &&
        body !== undefined
      const syntax = !fromPinia
        ? 'unverified-defineStore'
        : setup
          ? 'defineStore-setup'
          : 'defineStore-options'

      result = {
        profile: 'pinia-setup',
        syntax,
        node,
        ...(body === undefined ? {} : { body }),
      }
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(facts.sourceFile)
  return result
}

function composableDeclaration(
  name: string,
  sourceFile: ts.SourceFile,
): ComposableDeclaration | undefined {
  let result: ComposableDeclaration | undefined

  const visit = (node: ts.Node): void => {
    if (result !== undefined) {
      return
    }

    if (ts.isFunctionDeclaration(node) && node.name?.text === name && node.body !== undefined) {
      result = { node, body: node.body }
      return
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      const initializer = node.initializer
      if (
        initializer !== undefined &&
        (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
      ) {
        result = { node, body: initializer.body }
      } else {
        result = { node }
      }
      return
    }

    ts.forEachChild(node, visit)
  }

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
      return statement.body === undefined
        ? { node: statement }
        : { node: statement, body: statement.body }
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
          const initializer = declaration.initializer
          return initializer !== undefined &&
            (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
            ? { node: declaration, body: initializer.body }
            : { node: declaration }
        }
      }
    }
  }

  visit(sourceFile)
  return result
}

function findComposableCandidate(facts: SourceFacts): Candidate | undefined {
  const names: string[] = []
  const addName = (name: string): void => {
    if (!names.includes(name)) {
      names.push(name)
    }
  }

  for (const statement of facts.sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      isExported(statement) &&
      statement.name !== undefined
    ) {
      if (isUseName(statement.name.text)) {
        addName(statement.name.text)
      }
      continue
    }

    if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && isUseName(declaration.name.text)) {
          addName(declaration.name.text)
        }
      }
      continue
    }

    if (ts.isExportDeclaration(statement) && statement.exportClause !== undefined) {
      if (!ts.isNamedExports(statement.exportClause)) {
        continue
      }
      for (const element of statement.exportClause.elements) {
        if (!element.isTypeOnly && isUseName(element.name.text)) {
          addName(element.propertyName?.text ?? element.name.text)
        }
      }
    }
  }

  for (const name of names) {
    const declaration = composableDeclaration(name, facts.sourceFile)
    if (declaration !== undefined) {
      return {
        profile: 'composable-pure',
        syntax:
          declaration.body === undefined ? 'unsupported-exported-useX' : 'exported-useX-composable',
        node: declaration.node,
        ...(declaration.body === undefined ? {} : { body: declaration.body }),
      }
    }
  }

  return undefined
}

function findCandidate(facts: SourceFacts): Candidate | undefined {
  return findStoreCandidate(facts) ?? findComposableCandidate(facts)
}

function nodeName(node: ts.Expression): string | undefined {
  if (ts.isIdentifier(node)) {
    return node.text
  }

  if (ts.isPropertyAccessExpression(node)) {
    return node.name.text
  }

  return undefined
}

function isAsyncFunction(node: ts.Node): boolean {
  if (
    !ts.isArrowFunction(node) &&
    !ts.isFunctionExpression(node) &&
    !ts.isFunctionDeclaration(node) &&
    !ts.isMethodDeclaration(node)
  ) {
    return false
  }

  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) === true
  )
}

function hasStorageRoot(node: ts.Expression): boolean {
  let current: ts.Expression = node

  while (ts.isPropertyAccessExpression(current)) {
    if (ts.isIdentifier(current.expression) && STORAGE_ROOTS.has(current.expression.text)) {
      return true
    }
    current = current.expression
  }

  return ts.isIdentifier(current) && STORAGE_ROOTS.has(current.text)
}

function isStorageCall(node: ts.CallExpression): boolean {
  return (
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'clear' &&
    hasStorageRoot(node.expression)
  )
}

function hasDomRoot(node: ts.Expression): boolean {
  let current: ts.Expression = node

  while (ts.isPropertyAccessExpression(current)) {
    if (ts.isIdentifier(current.expression) && DOM_ROOTS.has(current.expression.text)) {
      return true
    }
    current = current.expression
  }

  return ts.isIdentifier(current) && DOM_ROOTS.has(current.text)
}

function isDomWriteTarget(node: ts.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(node) &&
    DOM_WRITE_PROPERTIES.has(node.name.text) &&
    hasDomRoot(node)
  )
}

function isDomWriteCall(node: ts.CallExpression): boolean {
  return (
    ts.isPropertyAccessExpression(node.expression) &&
    DOM_WRITE_METHODS.has(node.expression.name.text) &&
    hasDomRoot(node.expression)
  )
}

function collectEffects(root: ts.Node): ReadonlyMap<EffectName, ts.Node> {
  const effects = new Map<EffectName, ts.Node>()

  const add = (effect: EffectName, node: ts.Node): void => {
    if (!effects.has(effect)) {
      effects.set(effect, node)
    }
  }

  const visit = (node: ts.Node): void => {
    if (isAsyncFunction(node)) {
      add('async', node)
    }

    if (ts.isAwaitExpression(node)) {
      add('async', node)
    }

    if (ts.isCallExpression(node)) {
      const name = nodeName(node.expression)
      if (name !== undefined) {
        if (NETWORK_NAMES.has(name)) {
          add('network', node)
        }
        if (STORAGE_NAMES.has(name) || isStorageCall(node)) {
          add('storage', node)
        }
        if (TIMER_NAMES.has(name)) {
          add('timer', node)
        }
        if (SUBSCRIPTION_NAMES.has(name)) {
          add('subscription', node)
        }
        if (PLUGIN_NAMES.has(name)) {
          add('plugin', node)
        }
        if (ASYNC_NAMES.has(name)) {
          add('async', node)
        }
        if (
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === 'use' &&
          ts.isIdentifier(node.expression.expression) &&
          ['app', 'plugin', 'runtime'].includes(node.expression.expression.text)
        ) {
          add('plugin', node)
        }
      }
      if (isDomWriteCall(node)) {
        add('dom', node)
      }
    }

    if (ts.isNewExpression(node)) {
      const name = nodeName(node.expression)
      if (name !== undefined && NETWORK_NAMES.has(name)) {
        add('network', node)
      }
      if (name === 'Promise') {
        add('async', node)
      }
    }

    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
      isDomWriteTarget(node.left)
    ) {
      add('dom', node)
    }

    if (ts.isPropertyAccessExpression(node)) {
      const property = node.name.text
      if (property === 'cookie' || property === 'sendBeacon' || property === '$subscribe') {
        add(
          property === 'cookie'
            ? 'storage'
            : property === 'sendBeacon'
              ? 'network'
              : 'subscription',
          node,
        )
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(root)
  return effects
}

function parseFixture(fixtureText: string | undefined): FixtureResult {
  if (fixtureText === undefined || fixtureText.trim() === '') {
    return {
      blocker: 'missing-behavior-fixture',
      id: 'missing-behavior-fixture',
      assertions: [],
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(fixtureText)
  } catch {
    return {
      blocker: 'invalid-behavior-fixture',
      id: 'invalid-behavior-fixture',
      assertions: [],
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      blocker: 'invalid-behavior-fixture',
      id: 'invalid-behavior-fixture',
      assertions: [],
    }
  }

  const record = parsed as Record<string, unknown>
  const id = record.id
  const assertions = record.assertions
  if (
    typeof id !== 'string' ||
    id.trim() === '' ||
    !Array.isArray(assertions) ||
    assertions.length === 0 ||
    !assertions.every(
      (assertion) =>
        typeof assertion === 'object' &&
        assertion !== null &&
        typeof (assertion as Record<string, unknown>).expression === 'string' &&
        typeof (assertion as Record<string, unknown>).expected === 'string',
    )
  ) {
    return {
      blocker: 'invalid-behavior-fixture',
      id: 'invalid-behavior-fixture',
      assertions: [],
    }
  }

  return {
    spec: {
      id,
      assertions: assertions.map((assertion) => {
        const value = assertion as Record<string, unknown>
        return {
          expression: value.expression as string,
          expected: value.expected as string,
        }
      }),
    },
    id,
    assertions: [],
  }
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
}

function blocker(
  code: string,
  file: string,
  sourceFile: ts.SourceFile,
  node: ts.Node,
  detail: string,
): string {
  return `${code} ${file}:${lineOf(sourceFile, node)} ${detail}`
}

function makeEvidence(
  file: string,
  text: string,
  facts: SourceFacts,
  candidate: Candidate,
  fixtureText: string | undefined,
): StatePortabilityEvidence {
  const fixture = parseFixture(fixtureText)
  const sourceHash = createHash('sha256').update(text).digest('hex')
  const effects = collectEffects(facts.sourceFile)
  const effectNames = EFFECT_ORDER.filter((effect) => effects.has(effect))
  const blockers: string[] = []
  const addBlocker = (code: string, node: ts.Node, detail: string): void => {
    if (REFUSAL_CODES.has(code)) {
      blockers.push(blocker(code, file, facts.sourceFile, node, detail))
    }
  }

  if (candidate.syntax !== 'defineStore-setup' && candidate.syntax !== 'exported-useX-composable') {
    addBlocker(
      'unsupported-state-profile',
      candidate.node,
      `the declaration form ${candidate.syntax} is outside the approved profile`,
    )
  }

  for (const imported of facts.imports) {
    if (imported.status === 'allowed') {
      continue
    }
    if (imported.dynamic) {
      addBlocker('dynamic-state-import', imported.node, `dynamic import ${imported.specifier}`)
      continue
    }
    if (imported.status === 'disallowed') {
      if (imported.specifier.startsWith('.')) {
        addBlocker('relative-state-import', imported.node, `relative import ${imported.specifier}`)
      } else {
        addBlocker(
          'unsupported-state-import',
          imported.node,
          `import ${imported.specifier} is outside the vue and pinia profile`,
        )
      }
      continue
    }
    addBlocker(
      'unresolved-state-import',
      imported.node,
      `import ${imported.specifier} could not be resolved`,
    )
  }

  for (const effect of effectNames) {
    addBlocker(
      'unsupported-state-effect',
      effects.get(effect) ?? candidate.node,
      `effect ${effect}`,
    )
  }

  if (fixture.blocker !== undefined) {
    addBlocker(
      fixture.blocker,
      facts.sourceFile,
      'a valid state-portability.json descriptor is required',
    )
  }

  const uniqueBlockers = [...new Set(blockers)].sort((left, right) => {
    const leftCode = left.slice(0, left.indexOf(' '))
    const rightCode = right.slice(0, right.indexOf(' '))
    return leftCode.localeCompare(rightCode) || left.localeCompare(right)
  })
  const status: StatePortabilityStatus = uniqueBlockers.some(
    (entry) =>
      entry.startsWith('dynamic-state-import ') || entry.startsWith('unresolved-state-import '),
  )
    ? 'unknown'
    : uniqueBlockers.length > 0
      ? 'manual'
      : 'approved'

  return {
    profile: candidate.profile,
    syntax: candidate.syntax,
    imports: facts.imports.map(({ specifier, status: importStatusValue }) => ({
      specifier,
      status: importStatusValue,
    })),
    effects: effectNames,
    fixture: {
      id: fixture.spec?.id ?? fixture.id,
      sourceHash,
      status: 'pending',
      assertions: fixture.spec?.assertions ?? [],
    },
    status,
    blockers: uniqueBlockers,
  }
}

export function inspectStatePortability(
  file: string,
  text: string,
  fixtureText?: string,
): StatePortabilityEvidence | undefined {
  const facts = collectFacts(file, text)
  const candidate = findCandidate(facts)
  return candidate === undefined
    ? undefined
    : makeEvidence(file, text, facts, candidate, fixtureText)
}

export function statePortabilitySourceLine(file: string, text: string): number {
  const sourceFile = sourceFileFor(file, text)
  const candidate = findCandidate(collectFacts(file, text))

  return candidate === undefined ? 1 : lineOf(sourceFile, candidate.node)
}
