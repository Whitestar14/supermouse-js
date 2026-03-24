/**
 * Supermouse Doctor
 * A diagnostic utility to find common CSS conflicts that cause cursor glitches.
 */
export function doctor() {
  console.group('🐭 Supermouse Doctor');

  const hasInitialized = Array.from(document.querySelectorAll('style')).some(s => s.id.startsWith('supermouse-style-'));

  if (!hasInitialized) {
    console.warn('[x] Supermouse has not been initialized yet.');
    console.warn('   Please call doctor() after `new Supermouse()` has run.');
    console.groupEnd();
    return;
  }

  const issues: { el: Element, reason: string }[] = [];

  const inlineCursor = document.querySelectorAll('[style*="cursor"]');
  inlineCursor.forEach(el => {
    if (el.getAttribute('style')?.includes('cursor: none')) return;

    issues.push({
      el,
      reason: 'Element has inline "cursor" style. Remove it and let Supermouse handle state.'
    });
  });

  if (document.body.style.cursor !== 'none') {
    console.warn('[Global] document.body.style.cursor is not "none". Ensure { hideCursor: true } is passed to Supermouse.');
  }

  if (issues.length > 0) {
    console.warn(`Found ${issues.length} potential conflicts:`);
    issues.forEach(i => console.warn(`[${i.reason}]`, i.el));
    console.info('Tip: Avoid setting "cursor: pointer" manually. Use plugins or `rules` config instead.');
  } else {
    console.log('[ok] No obvious inline-style conflicts found.');
  }

  console.groupEnd();
}
