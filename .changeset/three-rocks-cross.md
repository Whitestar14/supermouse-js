---
"@supermousejs/states": patch
---

- States no longer requires last-registration order. It re-evaluates the managed plugin set every frame against the current hover state, so plugins installed after States are correctly enabled or disabled on the next frame.
- Behavior change: States is now authoritative for `isEnabled` on its managed plugins. A manual `app.enablePlugin()` or `app.disablePlugin()` call on a managed plugin is reverted on the next frame if it disagrees with the current state.
