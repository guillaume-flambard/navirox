/**
 * Fast Refresh for single file components.
 *
 * Vue already ships the whole runtime half of hot reloading, in its development
 * build only: `@vue/runtime-core` puts `__VUE_HMR_RUNTIME__` on the global with
 * `createRecord`, `rerender` and `reload`, and `mountComponent` tracks any
 * instance whose component definition carries `__hmrId`. What it does not have
 * is a compiler that stamps that id, because a bundler plugin is where that
 * belongs. Vite's Vue plugin is that half for Vite. This file is that half for
 * Metro.
 *
 * Why a Babel plugin and not a Metro transformer: the SFC transform is already
 * upstream's, and it re-labels its `.vue` output as `<file>.vue.tsx` before
 * handing it to React Native's Babel transformer. A plugin named in the app's
 * Babel configuration therefore sees exactly the module that transform produced,
 * needs no second transformer and no cache key of its own, and can be tested
 * with nothing but `@babel/core`. It is also the shape `react-refresh/babel`
 * takes for the other renderer.
 *
 * Nothing here is switched on `NODE_ENV`. `module.hot` exists only inside
 * Metro's development bundle and `__VUE_HMR_RUNTIME__` only inside the
 * framework's development build, so the two `typeof` guards below are the whole
 * condition, and a production bundle evaluates the same module it would have
 * evaluated without this file.
 */

/** The name Babel reports for this plugin in its own diagnostics. */
export const VUE_FAST_REFRESH_PLUGIN_NAME = 'navirox-vue-fast-refresh'

/**
 * The suffix the Vue transformer re-labels a compiled SFC with.
 *
 * The plugin activates on this and not on `.vue`: by the time Babel sees the
 * file, it is no longer a `.vue` file, and a plugin matching `.vue` would never
 * fire while looking correct.
 */
const VUE_LABEL_SUFFIX = '.vue.tsx'

/** The part of that suffix that is the re-label and not the source's own name. */
const RELABEL_EXTENSION = '.tsx'

/**
 * The identifier a component from this file is registered under.
 *
 * The component's own path, re-label removed, separators normalized to forward
 * slashes. Two edits of one file produce one identifier, two files never share
 * one, and an identifier in a log line names the file it came from. This is the
 * rule Vite's Vue plugin uses.
 */
export function fastRefreshId(filename: string): string {
  const source = filename.endsWith(VUE_LABEL_SUFFIX)
    ? filename.slice(0, -RELABEL_EXTENSION.length)
    : filename
  return source.replaceAll('\\', '/')
}

/** The bare minimum of Babel's node shape this file touches. */
interface BabelNode {
  type: string
  name?: string
  id?: BabelNode
  declaration?: BabelNode
  [key: string]: unknown
}

/** The parts of Babel's `NodePath` this file touches. */
interface BabelPath {
  node: BabelNode
  isExportDefaultDeclaration(): boolean
  insertBefore(nodes: readonly BabelNode[]): void
  replaceWithMultiple(nodes: readonly BabelNode[]): void
}

interface BabelProgramPath extends BabelPath {
  get(key: 'body'): readonly BabelPath[]
  scope: { generateUid(name: string): string }
}

interface BabelPluginState {
  filename?: string
  file?: { opts?: { filename?: string } }
}

/**
 * Structural, like `NaviroxMetroConfig`, so this package does not put Babel's
 * type graph in front of anyone who only wants the Metro preset. Babel hands
 * these in; nothing here is built by hand.
 */
interface BabelNodeFactory {
  identifier(name: string): BabelNode
  stringLiteral(value: string): BabelNode
  variableDeclaration(kind: string, declarations: readonly BabelNode[]): BabelNode
  variableDeclarator(id: BabelNode, init: BabelNode): BabelNode
  exportDefaultDeclaration(declaration: BabelNode): BabelNode
}

interface BabelTemplate {
  statements(
    code: string,
    options?: { placeholderPattern?: boolean | RegExp; placeholderWhitelist?: Set<string> },
  ): (substitutions: Record<string, BabelNode>) => readonly BabelNode[]
}

interface BabelPluginApi {
  types: BabelNodeFactory
  template: BabelTemplate
}

interface BabelPluginObject {
  name: string
  visitor: {
    Program: { exit(path: BabelProgramPath, state: BabelPluginState): void }
  }
}

/**
 * Turns a compiled single file component into a module that can update itself.
 *
 * The generated code, in order: the component is bound to a generated name, that
 * definition is stamped with a file-derived `__hmrId`, the definition is
 * registered with Vue's HMR runtime, this module declares itself a Metro hot
 * boundary, and the stamped definition is re-exported. The registration runs
 * while the module is evaluated, which is before any instance of it can mount,
 * and `reload` does nothing at all without an existing record.
 *
 * The identifier is the component's own path with the re-label suffix removed,
 * normalized to forward slashes. Two edits of one file produce one id, two files
 * never share one, and an id in a log line names the file it came from. This is
 * the rule Vite's plugin uses.
 */
export function withVueFastRefresh(api: BabelPluginApi): BabelPluginObject {
  const { types: t, template } = api

  // `__VUE_HMR_RUNTIME__` is an upper-case identifier, which is exactly what
  // Babel's default placeholder pattern matches. The whitelist is what keeps the
  // runtime's own name from being read as a placeholder.
  const registration = template.statements(
    `
    COMPONENT.__hmrId = ID;
    if (typeof __VUE_HMR_RUNTIME__ !== 'undefined') {
      __VUE_HMR_RUNTIME__.createRecord(ID, COMPONENT);
    }
    if (typeof module !== 'undefined' && module.hot) {
      module.hot.accept(function () {
        if (typeof __VUE_HMR_RUNTIME__ !== 'undefined') {
          __VUE_HMR_RUNTIME__.reload(ID, COMPONENT);
        }
      });
    }
  `,
    { placeholderPattern: false, placeholderWhitelist: new Set(['COMPONENT', 'ID']) },
  )

  return {
    name: VUE_FAST_REFRESH_PLUGIN_NAME,
    visitor: {
      Program: {
        exit(programPath, state) {
          const filename = state.file?.opts?.filename ?? state.filename
          if (filename === undefined || !filename.endsWith(VUE_LABEL_SUFFIX)) {
            return
          }

          const exportPath = programPath
            .get('body')
            .find((statement) => statement.isExportDefaultDeclaration())
          if (exportPath === undefined) {
            return
          }

          const declaration = exportPath.node.declaration
          if (declaration === undefined) {
            return
          }

          const id = t.stringLiteral(fastRefreshId(filename))

          // A name the component already has can be stamped where it stands, and
          // its own declaration is still the thing the app imports. A function
          // declaration is the same case: its binding is hoisted.
          const existingName =
            declaration.type === 'Identifier'
              ? declaration.name
              : declaration.type === 'FunctionDeclaration'
                ? declaration.id?.name
                : undefined
          if (existingName !== undefined) {
            exportPath.insertBefore(registration({ COMPONENT: t.identifier(existingName), ID: id }))
            return
          }

          // Otherwise the default export is an expression, which is what
          // `compileScript` emits: `export default /*@__PURE__*/_defineComponent({...})`
          // with an inline template, or `export default <component>` when the SFC
          // has CSS modules. Binding it is what gives the registration something
          // to stamp and the accept callback something to reload.
          const componentName = programPath.scope.generateUid('naviroxHmrComponent')
          exportPath.replaceWithMultiple([
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(componentName), declaration),
            ]),
            ...registration({ COMPONENT: t.identifier(componentName), ID: id }),
            t.exportDefaultDeclaration(t.identifier(componentName)),
          ])
        },
      },
    },
  }
}
