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
 */
import { createSymbioteRuntime } from '@navirox/runtime-symbiote/bootstrap';
import App from './App';
import { name as appName } from './app.json';

const runtime = createSymbioteRuntime();

runtime.mount(App, { name: appName });
