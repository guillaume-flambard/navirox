/**
 * @format
 *
 * The Navirox example app entry. This is the entire application surface the
 * native shell touches, and everything it imports is ours.
 *
 * `createSymbioteRuntime` comes from the adapter's `./bootstrap` subpath rather
 * than its main entry. The main entry is host free on purpose, so that tooling
 * can read the compatibility manifest in plain Node; the bootstrap subpath is
 * the one that reaches the renderer, and it is meant to be loaded by Metro.
 *
 * `mount` registers the root component under the app key the native shell
 * already knows about, which is the same `name` the iOS and Android projects
 * pass to React Native.
 *
 * `configure` is the one place an app is handed the Vue app the renderer creates,
 * before it mounts, and Pinia is installed there. Pinia has to be installed on the
 * app rather than imported where it is used, so this is the only entry point it
 * has. The alternative, a global, would tie the app to a single store instance
 * and break the moment two apps run in one process.
 */
import { createSymbioteRuntime } from '@navirox/runtime-symbiote/bootstrap';
import { createPinia } from 'pinia';
import App from './App';
import { name as appName } from './app.json';

const runtime = createSymbioteRuntime({
  configure: app => app.use(createPinia()),
});

runtime.mount(App, { name: appName });
