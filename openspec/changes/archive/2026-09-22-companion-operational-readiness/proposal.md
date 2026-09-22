# Companion operational readiness

## Why

The proof journeys demonstrate a happy-path workflow on devices. A field
companion is not credible if its behavior under unavailable network, expired
session, failed API request, interrupted attachment, accessibility settings, or
assistive technology is unstated. These cases need not all be supported now,
but they must be deliberately exercised or excluded.

## What changes

- Define a proof-readiness matrix for accessibility and operational failure
  modes.
- Require every journey to state for each relevant condition whether it is
  supported, simulated, deferred, or excluded, with an observable result.
- Add baseline accessibility acceptance criteria for text scaling, semantics,
  touch targets, contrast, and focus/navigation where the platform supports it.

## Capabilities

### New Capabilities

- `companion-operational-readiness`

### Modified Capabilities

- None.

## Impact

- Fixture and device-proof acceptance contracts.
- No authentication integration, offline synchronization engine, compliance
  certification, or claim that unsupported conditions are handled.
