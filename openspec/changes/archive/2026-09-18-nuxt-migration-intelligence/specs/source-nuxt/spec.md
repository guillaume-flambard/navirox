## ADDED Requirements

### Requirement: The adapter reads the application directory Nuxt 4 documents

The Nuxt adapter SHALL read page, layout, middleware and plugin files from the application directory Nuxt 4 documents (`app/`) in addition to the project root and `src/` locations it already reads, so a project created with the current defaults is read the same way as an older one.

#### Scenario: A page in the application directory becomes a route

- **WHEN** a project contains `app/pages/about.vue` and no other page directory
- **THEN** the inspection reports a route whose pattern is `/about` and whose source names that file

#### Scenario: A layout in the application directory becomes a layout unit

- **WHEN** a project contains `app/layouts/admin.vue`
- **THEN** the inspection reports a unit of kind `layout` whose source names that file

#### Scenario: Middleware and plugins in the application directory run outside the browser runtime

- **WHEN** a project contains `app/middleware/auth.ts` and `app/plugins/analytics.ts`
- **THEN** the inspection reports a finding for each file and reports neither as an application unit

### Requirement: Two page roots that claim one path are reported

When two page files from different page roots produce the same route pattern, the Nuxt adapter SHALL keep exactly one route, chosen by a rule that does not depend on directory order, and SHALL report the collision as a finding that names both files.

#### Scenario: Two roots claim one path

- **WHEN** a project contains `pages/about.vue` and `app/pages/about.vue`
- **THEN** the inspection reports one route for `/about` and one finding that names both files

### Requirement: Page metadata is read and stays adapter metadata

The Nuxt adapter SHALL read the `definePageMeta` call of a page: `path` and `alias` SHALL decide the routes the page has, and `layout`, `middleware`, `name` and `key` SHALL be recorded on the page's unit as adapter metadata. No construct of the macro SHALL become a shared concept of the App Graph.

#### Scenario: A declared path decides the route

- **WHEN** a page at `app/pages/blog/[slug].vue` declares `path: '/posts/:slug'`
- **THEN** the inspection reports a route whose pattern is `/posts/:slug` and whose source names that file

#### Scenario: A declared alias adds a route

- **WHEN** a page declares `alias: ['/u/:id']`
- **THEN** the inspection reports an additional route for that pattern whose source names the same file

#### Scenario: The layout and middleware a page names are recorded on its unit

- **WHEN** a page declares `layout: 'admin'` and `middleware: ['auth']`
- **THEN** the unit for that page carries that layout name and that middleware name in its metadata and the graph's own model gains no field for either

### Requirement: A page that names a layout or a middleware that does not exist is reported

When a page declares a layout or a middleware the project does not provide, the Nuxt adapter SHALL report a finding naming the page and the missing name rather than passing silently.

#### Scenario: A layout name with no file behind it

- **WHEN** a page declares `layout: 'admin'` and the project has no `app/layouts/admin.vue` or `layouts/admin.vue`
- **THEN** the inspection reports a finding that names the page and the missing layout

#### Scenario: A middleware name with no file behind it

- **WHEN** a page declares `middleware: ['auth']` and the project has no `app/middleware/auth.ts` or `middleware/auth.ts`
- **THEN** the inspection reports a finding that names the page and the missing middleware

### Requirement: The two halves of a component are read as two runtimes

The Nuxt adapter SHALL read a component whose file name ends in `.server.vue` as a file that runs outside the browser runtime, SHALL keep a component whose file name ends in `.client.vue` as a component and record that it renders only after mount, and SHALL NOT merge a `.client` and a `.server` file that share a name into one unit.

#### Scenario: A server component is reported rather than read as application code

- **WHEN** a project contains `app/components/Heavy.server.vue`
- **THEN** the inspection reports a finding for that file and reports no application unit for it

#### Scenario: A client component stays a component

- **WHEN** a project contains `app/components/Comments.client.vue`
- **THEN** the inspection reports a unit of kind `component` for that file whose metadata records that it renders only after mount

#### Scenario: A pair is two units

- **WHEN** a project contains both `app/components/Comments.client.vue` and `app/components/Comments.server.vue`
- **THEN** the inspection reports the finding for the server half and the unit for the client half, and never one unit that stands for both

### Requirement: The application config file is reported rather than read

The Nuxt adapter SHALL report `app.config.ts`, `app.config.js` and `app.config.mjs` as application configuration it does not read, under a finding code of its own so it is never confused with the runtime configuration file.

#### Scenario: An application config is named

- **WHEN** a project contains `app/app.config.ts`
- **THEN** the inspection reports a finding for that file whose code differs from the code used for `nuxt.config.ts`

### Requirement: The reading stays deterministic and traceable

Two inspections of the same project SHALL produce the same fragment, every node and finding SHALL keep a source location that names its file, and every node identifier SHALL begin with the identifier of this adapter.

#### Scenario: The same reading twice

- **WHEN** the same project is inspected twice
- **THEN** the two fragments are equal

#### Scenario: Every identifier names this adapter

- **WHEN** a page is read, including a component that the composed adapter read
- **THEN** every identifier begins with this adapter's identifier
