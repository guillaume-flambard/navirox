import { dirname, join, normalize } from 'node:path/posix'
import type { SourceLocation } from '@memolabs-apps/graph'
import type { DiscoveredRoute } from '@memolabs-apps/source'
import * as ts from 'typescript'

/** Files this adapter reads routes from. */
export const ROUTES_FILE_PATTERN = /\.routes\.[cm]?ts$/

/**
 * The routing module convention. Angular documents `<name>-routing.module.ts` as
 * the home of a route table, and an application written before the standalone
 * era keeps it there. The table is read exactly as a routes file; the module
 * declaration around it stays a module finding.
 */
export const ROUTING_MODULE_FILE_PATTERN = /[-.]routing\.module\.[cm]?ts$/

export function isRoutesFile(file: string): boolean {
  return ROUTES_FILE_PATTERN.test(file)
}

export function isRoutingModuleFile(file: string): boolean {
  return ROUTING_MODULE_FILE_PATTERN.test(file)
}

export interface RouteReading {
  readonly routes: readonly DiscoveredRoute[]
  readonly findings: readonly FindingDraft[]
}

export interface FindingDraft {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly file: string
}

/** The URL a stated path serves, and the parameters in it. */
export function routePattern(path: string): {
  readonly pattern: string
  readonly params: readonly string[]
} {
  const params = [...path.matchAll(/:([A-Za-z_][\w]*)/g)].map((match) => match[1] ?? '')

  if (path === '') {
    return { pattern: '/', params: [] }
  }

  return { pattern: path.startsWith('/') ? path : `/${path}`, params }
}

function nestedPattern(parent: string, child: string): string {
  if (child === '') {
    return parent
  }

  if (child.startsWith('/')) {
    return child
  }

  return parent === '/' ? `/${child}` : `${parent}/${child}`
}

function property(object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  for (const candidate of object.properties) {
    if (
      ts.isPropertyAssignment(candidate) &&
      (ts.isIdentifier(candidate.name) || ts.isStringLiteralLike(candidate.name)) &&
      candidate.name.text === name
    ) {
      return candidate.initializer
    }
  }

  return undefined
}

function location(file: string, sourceFile: ts.SourceFile, node: ts.Node): SourceLocation {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))

  return {
    file,
    adapterId: 'angular',
    start: { line: start.line + 1, column: start.character + 1 },
  }
}

function isRoutesDeclaration(declaration: ts.VariableDeclaration): boolean {
  if (ts.isIdentifier(declaration.name) && declaration.name.text === 'routes') {
    return true
  }

  return (
    declaration.type !== undefined &&
    ts.isTypeReferenceNode(declaration.type) &&
    declaration.type.typeName.getText() === 'Routes'
  )
}

function importedFiles(sourceFile: ts.SourceFile): ReadonlyMap<string, string> {
  const files = new Map<string, string>()

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith('.') ||
      statement.importClause?.namedBindings === undefined ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue
    }

    for (const binding of statement.importClause.namedBindings.elements) {
      files.set(binding.name.text, statement.moduleSpecifier.text)
    }
  }

  return files
}

function componentFile(
  file: string,
  route: ts.ObjectLiteralExpression,
  imports: ReadonlyMap<string, string>,
): string | undefined {
  const component = property(route, 'component')

  if (component === undefined || !ts.isIdentifier(component)) {
    return undefined
  }

  const module = imports.get(component.text)

  if (module === undefined) {
    return undefined
  }

  const path = normalize(join(dirname(file), module))

  return /\.[cm]?tsx?$/.test(path) ? path : `${path}.ts`
}

/**
 * The literal target of a standalone Angular `loadComponent` callback.
 *
 * The callback often includes a `.then` selection of the component export. The
 * export name does not affect the source file, so the only fact this reader
 * needs is the relative, literal `import()` argument. A computed or package
 * import deliberately returns nothing: it cannot name a local screen.
 */
function lazyComponentFile(file: string, route: ts.ObjectLiteralExpression): string | undefined {
  const loader = property(route, 'loadComponent')

  if (loader === undefined) {
    return undefined
  }

  const root: ts.Expression = loader
  let module: string | undefined

  const visit = (node: ts.Node): void => {
    const argument = ts.isCallExpression(node) ? node.arguments[0] : undefined

    if (
      module === undefined &&
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      argument !== undefined &&
      ts.isStringLiteralLike(argument) &&
      argument.text.startsWith('.')
    ) {
      module = argument.text
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(root)

  if (module === undefined) {
    return undefined
  }

  const path = normalize(join(dirname(file), module))

  return /\.[cm]?tsx?$/.test(path) ? path : `${path}.ts`
}

function readRouteArray(
  file: string,
  sourceFile: ts.SourceFile,
  initializer: ts.Expression,
  parentPath?: string,
  imports: ReadonlyMap<string, string> = new Map(),
): RouteReading {
  if (!ts.isArrayLiteralExpression(initializer)) {
    return {
      routes: [],
      findings: [
        {
          code: 'angular-routes-not-literal',
          title: 'The route table is not a literal array',
          message: `${file} declares routes through an expression, so no paths were guessed.`,
          file,
        },
      ],
    }
  }

  const routes: DiscoveredRoute[] = []
  const findings: FindingDraft[] = []

  for (const element of initializer.elements) {
    if (!ts.isObjectLiteralExpression(element)) {
      findings.push({
        code: 'angular-route-not-literal',
        title: 'A route is not a literal object',
        message: `${file} declares a route through an expression or spread, so it was not guessed.`,
        file,
      })
      continue
    }

    const path = property(element, 'path')

    if (path === undefined || !ts.isStringLiteralLike(path)) {
      findings.push({
        code: 'angular-route-path-not-literal',
        title: 'A route path is not a literal',
        message: `${file} declares a computed route path, so it was not guessed.`,
        file,
      })
      continue
    }

    const { pattern } = routePattern(path.text)
    const pathPattern = parentPath === undefined ? pattern : nestedPattern(parentPath, path.text)
    const params = routePattern(pathPattern).params
    const unitFile = componentFile(file, element, imports) ?? lazyComponentFile(file, element)

    routes.push({
      key: `${pathPattern}:${element.getStart(sourceFile)}`,
      pathPattern,
      ...(unitFile === undefined ? {} : { unitFile, unitKey: 'default' }),
      ...(params.length === 0 ? {} : { params }),
      source: location(file, sourceFile, element),
    })

    const children = property(element, 'children')

    if (children !== undefined && !ts.isArrayLiteralExpression(children)) {
      findings.push({
        code: 'angular-route-children-not-literal',
        title: 'Nested routes are not a literal array',
        message: `${file} declares nested routes through an expression, so their paths were not guessed.`,
        file,
      })
    } else if (children !== undefined) {
      const childReading = readRouteArray(file, sourceFile, children, pathPattern, imports)
      routes.push(...childReading.routes)
      findings.push(...childReading.findings)
    }

    if (property(element, 'loadChildren') !== undefined) {
      findings.push({
        code: 'angular-lazy-route',
        title: 'A lazy loaded route was not resolved',
        message: `${file} loads routes lazily. The stated parent path is reported and the lazy route table is not guessed.`,
        file,
      })
    }
  }

  return {
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    findings,
  }
}

/**
 * Reads literal Angular route declarations with the TypeScript parser.
 *
 * A literal child array is data and is resolved into its full URL. Lazy and
 * computed declarations are reported instead of traversing a call or guessing a
 * value, so every produced route has a source declaration behind it.
 */
export function readRoutes(file: string, text: string): RouteReading {
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const readings: RouteReading[] = []
  const imports = importedFiles(sourceFile)

  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      isRoutesDeclaration(node) &&
      node.initializer !== undefined
    ) {
      readings.push(readRouteArray(file, sourceFile, node.initializer, undefined, imports))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return {
    routes: readings
      .flatMap((reading) => reading.routes)
      .sort((left, right) => left.key.localeCompare(right.key)),
    findings: readings.flatMap((reading) => reading.findings),
  }
}
