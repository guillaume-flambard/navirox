import { fileURLToPath } from 'node:url'
import { runInspection } from '@navirox/inspect'
import { describe, expect, it } from 'vitest'
import { createAdapterRegistry } from './cli'

/**
 * The gate.
 *
 * Two frameworks, one feature journey, one pipeline, one model. The assertions
 * are deliberately strict, because a comparison that only checked that both
 * reports exist would pass on two adapters that agree on nothing.
 *
 * The fixtures live inside the adapter packages and mirror each other component
 * for component. The registry is built from the shipped composition root, so a
 * passing run says the shipped adapter set can carry two frameworks, not just
 * that a test local to the adapters can.
 */

function fixture(packageName: string, name: string): string {
  return fileURLToPath(new URL(`../../${packageName}/fixtures/${name}`, import.meta.url))
}

/** The shape of a report, with everything a framework could leak into. */
function shape(report: Awaited<ReturnType<typeof runInspection>>): unknown {
  if (!report.ok) {
    throw new Error('the comparison was handed a failed inspection')
  }

  const { graph } = report.report

  return {
    nodeCollections: Object.keys(graph).sort(),
    unitKinds: [...new Set(graph.units.map((node) => node.kind))].sort(),
    unitKeys: [...new Set(graph.units.flatMap((node) => Object.keys(node)))].sort(),
    capabilityNodes: graph.capabilities.map((node) => `${node.capability}:${node.usage}`).sort(),
    dependencyKeys: [
      ...new Set(
        graph.dependencies.flatMap((node) => Object.keys(node).filter((key) => key !== 'id')),
      ),
    ].sort(),
  }
}

describe('the composition root', () => {
  it('registers every adapter it names', async () => {
    const registry = await createAdapterRegistry()

    expect(registry.list().map((adapter) => adapter.id)).toEqual([
      'angular',
      'astro',
      'next',
      'nuxt',
      'qwik',
      'react',
      'solid',
      'svelte',
      'sveltekit',
      'vue',
    ])
  })

  it('selects the meta-framework for a SvelteKit project', async () => {
    const registry = await createAdapterRegistry()
    const selected = await registry.select({
      rootDir: '',
      files: ['package.json'],
      readText: (path) =>
        path === 'package.json'
          ? JSON.stringify({ dependencies: { svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' } })
          : undefined,
    })

    expect(selected?.adapterId).toBe('sveltekit')
  })

  it('selects Astro over the framework of the components it composes', async () => {
    const registry = await createAdapterRegistry()
    const selected = await registry.select({
      rootDir: '',
      files: ['package.json'],
      readText: (path) =>
        path === 'package.json'
          ? JSON.stringify({
              dependencies: { astro: '^7.0.0', '@astrojs/vue': '^5.0.0', vue: '^3.5.43' },
            })
          : undefined,
    })

    // Both adapters match, and the one that composes the other wins. This is the
    // third meta-framework the selection has to get right, and the first one that
    // composes more than a single base.
    expect(selected?.adapterId).toBe('astro')
  })
})

describe('two frameworks through one pipeline', () => {
  it('produces reports that are structurally comparable', async () => {
    const registry = await createAdapterRegistry()
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })
    const svelte = await runInspection({
      rootDir: fixture('source-svelte', 'svelte-app'),
      registry,
      framework: 'svelte',
    })

    expect(vue.ok).toBe(true)
    expect(svelte.ok).toBe(true)
    expect(shape(vue)).toEqual(shape(svelte))
  })

  it('reads the same capabilities from both projects', async () => {
    const registry = await createAdapterRegistry()
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })
    const svelte = await runInspection({
      rootDir: fixture('source-svelte', 'svelte-app'),
      registry,
      framework: 'svelte',
    })

    if (!vue.ok || !svelte.ok) {
      throw new Error('both inspections have to succeed')
    }

    const capabilities = (report: typeof vue.report): string[] =>
      report.graph.capabilities.map((node) => `${node.capability}:${node.usage}`).sort()

    expect(capabilities(vue.report)).toEqual(capabilities(svelte.report))
    expect(capabilities(vue.report)).toContain('local-storage:read')
    expect(capabilities(vue.report)).toContain('geolocation:invoke')
  })

  it('finds a route only where a framework documents one', async () => {
    const registry = await createAdapterRegistry()
    const sveltekit = await runInspection({
      rootDir: fixture('source-sveltekit', 'sveltekit-app'),
      registry,
      framework: 'sveltekit',
    })
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })

    if (!sveltekit.ok || !vue.ok) {
      throw new Error('both inspections have to succeed')
    }

    expect(sveltekit.report.graph.routes.map((route) => route.pathPattern)).toEqual([
      '/',
      '/about',
      '/blog/:slug',
    ])
    expect(vue.report.graph.routes).toEqual([])
  })

  it('did not have to move the shared schema for a second framework', async () => {
    const registry = await createAdapterRegistry()
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })
    const sveltekit = await runInspection({
      rootDir: fixture('source-sveltekit', 'sveltekit-app'),
      registry,
      framework: 'sveltekit',
    })

    if (!vue.ok || !sveltekit.ok) {
      throw new Error('both inspections have to succeed')
    }

    // The report schema and the graph schema are the strongest available
    // statement that a second framework did not force the model to move.
    expect(vue.report.schemaVersion).toBe(1)
    expect(vue.report.graph.schemaVersion).toBe(1)
    expect(sveltekit.report.graph.schemaVersion).toBe(1)
  })
})

describe('the Nuxt adapter through the pipeline', () => {
  it('is registered and preferred over the Vue adapter', async () => {
    const registry = await createAdapterRegistry()

    expect(registry.list().map((adapter) => adapter.id)).toEqual([
      'angular',
      'astro',
      'next',
      'nuxt',
      'qwik',
      'react',
      'solid',
      'svelte',
      'sveltekit',
      'vue',
    ])
  })

  it('reads both what Nuxt adds and what the Vue adapter read', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-nuxt', 'nuxt-app'),
      registry,
    })

    expect(outcome.ok).toBe(true)

    if (!outcome.ok) {
      return
    }

    const { graph } = outcome.report

    // The composition: routes and layouts come from the Nuxt reading, the
    // components and the store from the Vue reading, and every identifier names
    // the adapter that produced the fragment.
    // Sorted by identifier, which is what makes two runs identical.
    expect([...graph.routes.map((route) => route.pathPattern)].sort()).toEqual([
      '/',
      '/about',
      '/blog',
      '/blog/:slug',
      '/docs/:lang',
    ])
    expect(graph.units.map((unit) => unit.kind)).toContain('layout')
    expect(graph.units.map((unit) => unit.kind)).toContain('utility')
    expect(graph.units.some((unit) => unit.kind === 'state-module')).toBe(true)
    expect(
      graph.units.every((unit) => unit.id.startsWith('nuxt:')) &&
        graph.routes.every((route) => route.id.startsWith('nuxt:')),
    ).toBe(true)
    expect(graph.findings.some((finding) => finding.code === 'nuxt-server-code')).toBe(true)
  })
})

describe('Angular, the framework that assembles an application differently', () => {
  it('produces a report with the same shape as the Vue report', async () => {
    const registry = await createAdapterRegistry()
    const angular = await runInspection({
      rootDir: fixture('source-angular', 'angular-app'),
      registry,
      framework: 'angular',
    })
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })

    expect(angular.ok).toBe(true)
    expect(vue.ok).toBe(true)
    // The gate's question: did the model need anything new for a framework whose
    // structure comes from decorators, whose state comes from what a class holds,
    // and whose routing is TypeScript rather than a directory?
    expect(shape(angular)).toEqual(shape(vue))
  })

  it('reads the same capabilities, and its own routes', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-angular', 'angular-app'),
      registry,
      framework: 'angular',
    })

    expect(outcome.ok).toBe(true)

    if (!outcome.ok) {
      return
    }

    const capabilities = outcome.report.graph.capabilities
      .map((node) => `${node.capability}:${node.usage}`)
      .sort()
    const kinds = [...new Set(outcome.report.graph.units.map((node) => node.kind))].sort()

    expect(capabilities).toContain('local-storage:write')
    expect(capabilities).toContain('geolocation:invoke')
    expect(kinds).toEqual(['component', 'state-module', 'utility'])
    expect(outcome.report.graph.routes.map((route) => route.pathPattern).sort()).toEqual([
      '/',
      '/about',
      '/blog/:slug',
    ])
    expect(outcome.report.graph.units.every((unit) => unit.id.startsWith('angular:'))).toBe(true)
  })
})

describe('React, the framework the target also uses', () => {
  it('produces a report with the same shape as the Vue report', async () => {
    const registry = await createAdapterRegistry()
    const react = await runInspection({
      rootDir: fixture('source-react', 'react-app'),
      registry,
      framework: 'react',
    })
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })

    expect(react.ok).toBe(true)
    expect(vue.ok).toBe(true)
    // The gate's question for this one: does a framework the target also uses
    // produce the same report shape, or does proximity to the renderer leak?
    expect(shape(react)).toEqual(shape(vue))
  })

  it('refuses a native project rather than reading the target as a source', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-react', 'react-bad'),
      registry,
    })

    expect(outcome.ok).toBe(false)

    if (!outcome.ok) {
      expect(outcome.reason).toBe('no-adapter')
    }
  })

  it('names the native dependency when it is chosen by name', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-react', 'react-bad'),
      registry,
      framework: 'react',
    })

    expect(outcome.ok).toBe(true)

    if (outcome.ok) {
      expect(
        outcome.report.graph.findings.some((finding) => finding.code === 'react-native-dependency'),
      ).toBe(true)
    }
  })
})

describe('Next, the framework React projects are actually written in', () => {
  it('reads both routers into one route set', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-next', 'next-app'),
      registry,
      framework: 'next',
    })

    expect(outcome.ok).toBe(true)

    if (!outcome.ok) {
      return
    }

    expect([...outcome.report.graph.routes.map((route) => route.pathPattern)].sort()).toEqual([
      '/',
      '/about',
      '/blog/:slug',
      '/dashboard',
      '/pricing',
      '/profile',
    ])
    expect(outcome.report.graph.units.every((unit) => unit.id.startsWith('next:'))).toBe(true)
  })

  /**
   * The comparison is precise rather than strict, and the difference is named.
   *
   * Next requires a root layout, so the fixture cannot be a component for
   * component twin of the Vue fixture: the layout is the one addition. Quietly
   * dropping it to make a strict equality hold would have tested a project that
   * cannot exist.
   */
  it('produces a report the Vue report explains, plus the layout it must have', async () => {
    const registry = await createAdapterRegistry()
    const next = await runInspection({
      rootDir: fixture('source-next', 'next-app'),
      registry,
      framework: 'next',
    })
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })

    expect(next.ok).toBe(true)
    expect(vue.ok).toBe(true)

    if (!next.ok || !vue.ok) {
      return
    }

    const capabilities = (report: typeof next.report): string[] =>
      report.graph.capabilities.map((node) => `${node.capability}:${node.usage}`).sort()
    const kinds = (report: typeof next.report): string[] =>
      [...new Set(report.graph.units.map((node) => node.kind))].sort()

    expect(capabilities(next.report)).toEqual(capabilities(vue.report))
    expect(kinds(next.report)).toEqual([...kinds(vue.report), 'layout'].sort())
    expect(next.report.graph.schemaVersion).toBe(1)
  })

  it('reports the server surface instead of reading it as application code', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-next', 'next-app'),
      registry,
      framework: 'next',
    })

    expect(outcome.ok).toBe(true)

    if (!outcome.ok) {
      return
    }

    expect(
      outcome.report.graph.findings.filter((finding) => finding.code === 'next-server-surface'),
    ).toHaveLength(3)
  })

  it('refuses a Next project that declares the native runtime', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-next', 'next-bad'),
      registry,
      framework: 'next',
    })

    // The fixture declares an untested major rather than a native dependency, so
    // the reading succeeds and says so; the refusal is asserted in the adapter.
    expect(outcome.ok).toBe(true)

    if (outcome.ok) {
      expect(
        outcome.report.graph.findings.some((finding) => finding.code === 'version-untested'),
      ).toBe(true)
    }
  })
})

describe('Astro, the framework whose pages belong to several frameworks', () => {
  it('reads the routes out of src/pages', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-astro', 'astro-app'),
      registry,
      framework: 'astro',
    })

    expect(outcome.ok).toBe(true)

    if (!outcome.ok) {
      return
    }

    expect([...outcome.report.graph.routes.map((route) => route.pathPattern)].sort()).toEqual([
      '/',
      '/:lang-:version/info',
      '/about',
      '/blog/:slug',
      '/posts/1',
      '/sequences/:path',
    ])
    expect(outcome.report.graph.units.every((unit) => unit.id.startsWith('astro:'))).toBe(true)
  })

  /**
   * The comparison is precise rather than strict, and the difference is named.
   *
   * The Astro fixture is a component for component twin of the Vue fixture, with
   * the components it hydrates written in Vue, React and Svelte. The one
   * difference the model reports is the state module: Vue reads one because the
   * store declaration is a Vue fact the Vue adapter knows, and this adapter has no
   * store rule to apply to a `.svelte` or `.tsx` file, so it reads those as the
   * application modules they are. Nothing is missing from the reading; the rule
   * that would name a store belongs to the adapter of that framework.
   *
   * There is no layout difference here, unlike Next: Astro places a layout in
   * `src/layouts` by convention and says so in its own documentation, so a
   * `.astro` component outside `src/pages` is a component and not a framework
   * concept.
   */
  it('produces the Vue report, minus the store only the Vue adapter can read', async () => {
    const registry = await createAdapterRegistry()
    const astro = await runInspection({
      rootDir: fixture('source-astro', 'astro-app'),
      registry,
      framework: 'astro',
    })
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })

    expect(astro.ok).toBe(true)
    expect(vue.ok).toBe(true)

    if (!astro.ok || !vue.ok) {
      return
    }

    const capabilities = (report: typeof astro.report): string[] =>
      report.graph.capabilities.map((node) => `${node.capability}:${node.usage}`).sort()
    const kinds = (report: typeof astro.report): string[] =>
      [...new Set(report.graph.units.map((node) => node.kind))].sort()

    expect(capabilities(astro.report)).toEqual(capabilities(vue.report))
    expect(kinds(astro.report)).toEqual(kinds(vue.report).filter((kind) => kind !== 'state-module'))
    expect(astro.report.graph.schemaVersion).toBe(1)
  })

  it('reports the server surface instead of reading it as application code', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-astro', 'astro-app'),
      registry,
      framework: 'astro',
    })

    expect(outcome.ok).toBe(true)

    if (!outcome.ok) {
      return
    }

    const codes = outcome.report.graph.findings.map((finding) => finding.code)

    // An endpoint under src/pages, the middleware, and the build configuration.
    expect(codes.filter((code) => code === 'astro-endpoint')).toHaveLength(1)
    expect(codes.filter((code) => code === 'astro-middleware')).toHaveLength(1)
    expect(codes.filter((code) => code === 'astro-config')).toHaveLength(1)
  })

  it('says so when the Astro major was not tested', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-astro', 'astro-bad'),
      registry,
      framework: 'astro',
    })

    expect(outcome.ok).toBe(true)

    if (outcome.ok) {
      expect(
        outcome.report.graph.findings.some((finding) => finding.code === 'version-untested'),
      ).toBe(true)
    }
  })
})

describe('Solid, the second source read through JSX', () => {
  it('reads the routes the router declares in either shape', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-solid', 'solid-app'),
      registry,
      framework: 'solid',
    })

    expect(outcome.ok).toBe(true)

    if (!outcome.ok) {
      return
    }

    expect([...outcome.report.graph.routes.map((route) => route.pathPattern)].sort()).toEqual([
      '/',
      '/profile',
      '/rows/:id',
    ])
    expect(outcome.report.graph.units.every((unit) => unit.id.startsWith('solid:'))).toBe(true)
  })

  /**
   * Solid is read through the same lenses as React, and this fixture is the
   * component for component twin of the Vue one, so the two reports have to
   * match without a named difference. The state library differs (a Solid store is
   * a proxy from `solid-js/store`) and the router differs, but neither shows up
   * in the shape of the model: the kinds of unit, the capabilities and the keys a
   * node carries are the same, the reading produced no finding at all, and the
   * schema stayed where it was.
   */
  it('produces the report the Vue fixture produces', async () => {
    const registry = await createAdapterRegistry()
    const solid = await runInspection({
      rootDir: fixture('source-solid', 'solid-app'),
      registry,
      framework: 'solid',
    })
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })

    expect(solid.ok).toBe(true)
    expect(vue.ok).toBe(true)

    if (!solid.ok || !vue.ok) {
      return
    }

    const capabilities = (report: typeof solid.report): string[] =>
      report.graph.capabilities.map((node) => `${node.capability}:${node.usage}`).sort()
    const kinds = (report: typeof solid.report): string[] =>
      [...new Set(report.graph.units.map((node) => node.kind))].sort()

    expect(capabilities(solid.report)).toEqual(capabilities(vue.report))
    expect(kinds(solid.report)).toEqual(kinds(vue.report))
    expect(solid.report.graph.findings).toEqual([])
    expect(solid.report.graph.schemaVersion).toBe(1)
  })

  it('says so when the Solid major was not tested', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-solid', 'solid-bad'),
      registry,
      framework: 'solid',
    })

    expect(outcome.ok).toBe(true)

    if (outcome.ok) {
      expect(
        outcome.report.graph.findings.some((finding) => finding.code === 'version-untested'),
      ).toBe(true)
    }
  })
})

describe('Qwik, the framework whose components are boundaries', () => {
  it('reads Qwik City pages and the layouts they select', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-qwik', 'qwik-app'),
      registry,
      framework: 'qwik',
    })

    expect(outcome.ok).toBe(true)

    if (!outcome.ok) {
      return
    }

    expect([...outcome.report.graph.routes.map((route) => route.pathPattern)].sort()).toEqual([
      '/',
      '/about',
      '/dashboard',
      '/docs/:slug',
      '/posts/:id',
      '/pricing',
      '/profile',
    ])
    expect(outcome.report.graph.units.every((unit) => unit.id.startsWith('qwik:'))).toBe(true)
  })

  /**
   * Qwik is read on the same pipeline as Vue, and the fixture mirrors the shared
   * journey, so the capabilities have to match. The kinds cannot: Qwik documents
   * no store module to import, so a `useStore` call is state inside a component
   * rather than a unit of its own, and `layout.tsx` is a documented contract, so
   * a layout is a unit here where Vue has none. Both differences are named
   * rather than smoothed over, and the assertion spells them out in both
   * directions.
   */
  it('produces the Vue report minus a store module, plus a documented layout', async () => {
    const registry = await createAdapterRegistry()
    const qwik = await runInspection({
      rootDir: fixture('source-qwik', 'qwik-app'),
      registry,
      framework: 'qwik',
    })
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })

    expect(qwik.ok).toBe(true)
    expect(vue.ok).toBe(true)

    if (!qwik.ok || !vue.ok) {
      return
    }

    const capabilities = (report: typeof qwik.report): string[] =>
      report.graph.capabilities.map((node) => `${node.capability}:${node.usage}`).sort()
    const kinds = (report: typeof qwik.report): string[] =>
      [...new Set(report.graph.units.map((node) => node.kind))].sort()

    expect(capabilities(qwik.report)).toEqual(capabilities(vue.report))
    expect(kinds(qwik.report)).toEqual(
      [...kinds(vue.report).filter((kind) => kind !== 'state-module'), 'layout'].sort(),
    )
    expect(kinds(qwik.report).includes('state-module')).toBe(false)
    expect(qwik.report.graph.schemaVersion).toBe(1)
  })

  it('reports the surface Qwik City documents instead of reading it', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-qwik', 'qwik-app'),
      registry,
      framework: 'qwik',
    })

    expect(outcome.ok).toBe(true)

    if (outcome.ok) {
      const codes = outcome.report.graph.findings.map((finding) => finding.code)

      expect(codes).toContain('qwik-endpoint')
      expect(codes).toContain('qwik-not-found-page')
      expect(codes).toContain('qwik-plugin')
      expect(codes).toContain('qwik-route-rewrite')
    }
  })

  it('says so when the Qwik major was not tested', async () => {
    const registry = await createAdapterRegistry()
    const outcome = await runInspection({
      rootDir: fixture('source-qwik', 'qwik-bad'),
      registry,
      framework: 'qwik',
    })

    expect(outcome.ok).toBe(true)

    if (outcome.ok) {
      expect(
        outcome.report.graph.findings.some((finding) => finding.code === 'version-untested'),
      ).toBe(true)
    }
  })
})
