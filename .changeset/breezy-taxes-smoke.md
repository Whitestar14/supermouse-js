---
"@supermousejs/labs": minor
---

- Restructured @supermousejs/labs to be maximally treeshakeable and reducing bundle size
- Updated `TextRing` to use CSS `letterSpacing` as SVG `textlength`/`lengthAdjust` attributes don't work/work reliably on Firefox-based browsers. Bug report: https://bugzilla.mozilla.org/show_bug.cgi?id=569722
- Updated Sparkles to use decayPerSecond so it's frame-independent
- Updated READMEs to reflect API changes and better scope description
- Removed now-deprecated @supermousejs/zoetrope dependency as utilities have now been moved to @supermousejs/utils
