---
"@supermousejs/core": patch
---

Fixed CSS stylesheets being destroyed erroneously from a lack of a primary owner and plugins being activated all at once by the `States` plugin when re-entering previously exited scope
