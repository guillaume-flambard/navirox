---
'@memolabs-apps/visual-benchmark': patch
---

Handle Detox Android reverse-port cleanup idempotently when the _same_ listener was already removed, without masking other ADB errors or weakening native screenshot assertions.
