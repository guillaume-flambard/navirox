import { dirname, join, normalize } from 'node:path/posix'
import type { SourceLocation } from '@memolabs-apps/graph'
import type { DiscoveredRoute } from '@memolabs-apps/source'
import * as ts from 'typescript'
import { ADAPTER_ID } from './detect.js'

export interface RouteFinding {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly source: SourceLocation
}

export interface RouteReading {
  readonly routes: readonly DiscoveredRoute[]
  readonly findings: readonly RouteFinding[]
}

export type ModuleResolver = (file: string, specifier: string) => string | undefined

function propertyName(property: ts.ObjectLiteralElementLike): string | undefined {
  if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
    return undefined
  }

  return ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name)
    ? property.name.text
    : undefined
}

function property(object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  for (const candidate of object.properties) {
    if (ts.isPropertyAssignment(candidate) && propertyName(candidate) === name) {
      return candidate.initializer
    }

    if (ts.isShorthandPropertyAssignment(candidate) && propertyName(candidate) === name) {
      return candidate.name
    }
  }

  return undefined
}

function routePattern(path: string): {
  readonly pattern: string
  readonly params: readonly string[]
} {
  const params = [...path.matchAll(/:([A-Za-z_][\w]*)/g)].map((match) => match[1] ?? '')

  if (path === '') {
    return { pattern: '/', params: [] }
  }

  return { pattern: path.startsWith('/') ? path : `/${path}`, params }
}

/** Resolves a child path according to Vue Router's literal nested-route shape. */
function nestedPattern(parent: string, child: string): string {
  if (child === '') {
    return parent
  }

  if (child.startsWith('/')) {
    return child
  }

  return parent === '/' ? `/${child}` : `${parent}/${child}`
}

function location(file: string, sourceFile: ts.SourceFile, node: ts.Node): SourceLocation {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))

  return {
    file,
    adapterId: ADAPTER_ID,
    start: { line: start.line + 1, column: start.character + 1 },
  }
}

function routerFactoryNames(sourceFile: ts.SourceFile): ReadonlySet<string> {
  const names = new Set<string>()

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== 'vue-router' ||
      statement.importClause?.namedBindings === undefined ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue
    }

    for (const imported of statement.importClause.namedBindings.elements) {
      const exportedName = imported.propertyName?.text ?? imported.name.text

      if (exportedName === 'createRouter') {
        names.add(imported.name.text)
      }
    }
  }

  return names
}

/** Local names imported from a relative module, keyed by the name used in this file. */
function importedFiles(sourceFile: ts.SourceFile): ReadonlyMap<string, string> {
  const files = new Map<string, string>()

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith('.')
    ) {
      continue
    }

    const clause = statement.importClause

    if (clause?.name !== undefined) {
      files.set(clause.name.text, statement.moduleSpecifier.text)
    }

    if (clause?.namedBindings !== undefined && ts.isNamedImports(clause.namedBindings)) {
      for (const binding of clause.namedBindings.elements) {
        files.set(binding.name.text, statement.moduleSpecifier.text)
      }
    }
  }

  return files
}

function importedModule(
  expression: ts.Expression,
  imports: ReadonlyMap<string, string>,
): string | undefined {
  if (ts.isIdentifier(expression)) {
    return imports.get(expression.text)
  }

  if (ts.isArrowFunction(expression) && ts.isCallExpression(expression.body)) {
    const imported = expression.body.arguments[0]

    if (
      expression.body.expression.kind === ts.SyntaxKind.ImportKeyword &&
      imported !== undefined &&
      ts.isStringLiteralLike(imported)
    ) {
      return imported.text
    }
  }

  return undefined
}

function relativeModule(file: string, specifier: string): string | undefined {
  return specifier.startsWith('.') ? normalize(join(dirname(file), specifier)) : undefined
}

function componentFile(
  file: string,
  route: ts.ObjectLiteralExpression,
  imports: ReadonlyMap<string, string>,
  resolveModule: ModuleResolver,
): string | undefined {
  const component = property(route, 'component')

  if (component === undefined) {
    return undefined
  }

  const module = importedModule(component, imports)

  return module === undefined ? undefined : resolveModule(file, module)
}

/** Literal route tables declared in the same module as `createRouter`. */
function routeTables(sourceFile: ts.SourceFile): ReadonlyMap<string, ts.ArrayLiteralExpression> {
  const tables = new Map<string, ts.ArrayLiteralExpression>()

  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      ts.isArrayLiteralExpression(node.initializer) &&
      node.initializer.elements.every(ts.isObjectLiteralExpression)
    ) {
      tables.set(node.name.text, node.initializer)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return tables
}

function routesFrom(
  file: string,
  sourceFile: ts.SourceFile,
  initializer: ts.Expression,
  parentPath?: string,
  imports: ReadonlyMap<string, string> = new Map(),
  resolveModule: ModuleResolver = relativeModule,
): RouteReading {
  const findings: RouteFinding[] = []

  if (!ts.isArrayLiteralExpression(initializer)) {
    return {
      routes: [],
      findings: [
        {
          code: 'router-routes-not-literal',
          title: 'The route table is not a literal array',
          message: `${file} passes a route table the adapter cannot establish statically, so no routes were produced.`,
          source: location(file, sourceFile, initializer),
        },
      ],
    }
  }

  const routes: DiscoveredRoute[] = []

  for (const element of initializer.elements) {
    if (!ts.isObjectLiteralExpression(element)) {
      findings.push({
        code: 'router-route-not-literal',
        title: 'A route is not a literal object',
        message: `${file} declares a route through an expression or spread, so it was not guessed.`,
        source: location(file, sourceFile, element),
      })
      continue
    }

    const path = property(element, 'path')

    if (path === undefined || !ts.isStringLiteralLike(path)) {
      findings.push({
        code: 'router-route-path-not-literal',
        title: 'A route path is not a literal',
        message: `${file} declares a route whose path is computed, so it was not guessed.`,
        source: location(file, sourceFile, element),
      })
      continue
    }

    const { pattern } = routePattern(path.text)
    const pathPattern = parentPath === undefined ? pattern : nestedPattern(parentPath, path.text)
    const params = routePattern(pathPattern).params
    const unitFile = componentFile(file, element, imports, resolveModule)

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
        code: 'router-route-children-not-literal',
        title: 'Nested routes are not a literal array',
        message: `${file} declares nested routes through an expression, so their paths were not guessed.`,
        source: location(file, sourceFile, children),
      })
    } else if (children !== undefined) {
      const childReading = routesFrom(
        file,
        sourceFile,
        children,
        pathPattern,
        imports,
        resolveModule,
      )
      routes.push(...childReading.routes)
      findings.push(...childReading.findings)
    }
  }

  return {
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    findings,
  }
}

/**
 * Reads route paths from the literal `routes` property passed to Vue Router's
 * `createRouter`. The TypeScript parser establishes the object structure, so a
 * `path` in a comment, a component prop, or another configuration object cannot
 * become a route by accident.
 */
export function readRoutes(
  file: string,
  text: string,
  resolveModule: ModuleResolver = relativeModule,
): RouteReading {
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const readings: RouteReading[] = []
  const factoryNames = routerFactoryNames(sourceFile)
  const imports = importedFiles(sourceFile)
  const tables = routeTables(sourceFile)

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      factoryNames.has(node.expression.text)
    ) {
      const options = node.arguments[0]

      if (options === undefined || !ts.isObjectLiteralExpression(options)) {
        readings.push({
          routes: [],
          findings: [
            {
              code: 'router-options-not-literal',
              title: 'The router options are not a literal object',
              message: `${file} passes computed options to createRouter, so no routes were produced.`,
              source: location(file, sourceFile, node),
            },
          ],
        })
      } else {
        const routes = property(options, 'routes')

        if (routes === undefined) {
          readings.push({
            routes: [],
            findings: [
              {
                code: 'router-routes-missing',
                title: 'The router declares no literal route table',
                message: `${file} calls createRouter without a literal routes property, so no routes were produced.`,
                source: location(file, sourceFile, options),
              },
            ],
          })
        } else {
          const routeTable = ts.isIdentifier(routes) ? (tables.get(routes.text) ?? routes) : routes

          readings.push(routesFrom(file, sourceFile, routeTable, undefined, imports, resolveModule))
        }
      }
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
