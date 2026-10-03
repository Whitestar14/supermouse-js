# @supermousejs/browser-tests

End-to-end browser tests for behavior that jsdom cannot verify — CSS cascade
resolution, top-layer interaction, and browser UA cursor values.

## Setup

Browsers are a one-time download per machine (~500 MB across all three
engines). They cache outside the repo.

From the repo root:

    pnpm --filter @supermousejs/browser-tests exec playwright install chromium firefox webkit

On Linux (including Codespaces), add `--with-deps` to pull system libraries.

## Running

    pnpm --filter @supermousejs/browser-tests test:e2e              # all projects
    pnpm --filter @supermousejs/browser-tests test:e2e:chromium     # single project
    pnpm --filter @supermousejs/browser-tests test:e2e:headed       # watch

These tests are intentionally NOT part of `pnpm -r test`. The fast suite
stays fast; the browser suite runs when invoked.
