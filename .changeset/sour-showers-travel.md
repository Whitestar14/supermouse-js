---
"@supermousejs/core": minor
---

- Unified cursor modes to reduce api surface by replacing cursor and hideCursor with single cursor option, decouple interaction parsing causing bugs
- Cache rule entries and hover selector string to reduce per-frame work.
- Suspend/resume no longer toggle native cursor state. this is an identified multi-scope limitation.
