---
"@supermousejs/core": patch
---

Restore `input` and `textarea` to `DEFAULT_NATIVE_CURSOR_SELECTORS`.

Beta.5 removed them on the assumption that the probe would catch them via
their UA `cursor: text` value. Browser testing showed WebKit doesn't
set a UA cursor on form controls — the computed value is `auto` — so
the probe doesn't fire there and the custom cursor showed over form
fields in Safari.
