# Angular route parser dependency

`@memolabs-apps/source-angular` ships `typescript@~6.0.3` because its route
reader executes the TypeScript AST parser when a user runs `navirox analyze`.
The dependency is intentionally a production dependency rather than a tool only
available while developing this monorepo: a packed and installed Navirox
analyzer must parse Angular route declarations without resolving back to this
checkout.

The version matches the workspace TypeScript pin and the compiler used by the
other source readers. No Angular compiler package is imported; framework
knowledge remains inside the Angular adapter.
