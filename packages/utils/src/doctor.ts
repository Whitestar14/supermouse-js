
/**
 * Supermouse Doctor
 * A diagnostic utility to find common CSS conflicts that cause "Double Cursor" glitches.
 */
export function doctor() {
  console.group('🐭 Supermouse Doctor');

  // 0. Check Initialization
  // Supermouse injects a style tag with an ID starting with 'supermouse-style-'
  const hasInitialized = Array.from(document.querySelectorAll('style')).some(s => s.id.startsWith('supermouse-style-'));
  
  if (!hasInitialized) {
    console.warn('❌ Supermouse has not been initialized yet.');
    console.warn('   Please call doctor() AFTER "new Supermouse()" has run.');
    console.groupEnd();
    return;
  }

  const issues: { el: Element, reason: string }[] = [];

  // 1. Check for Inline Styles (Hard Overrides)
  const inlineCursor = document.querySelectorAll('[style*="cursor"]');
  inlineCursor.forEach(el => {
    // Ignore the supermouse container itself (usually has cursor: none)
    if (el.getAttribute('style')?.includes('cursor: none')) return;
    
    issues.push({ 
      el, 
      reason: 'Element has inline "cursor" style. Remove it and let Supermouse handle state.' 
    });
  });

  // 2. Check Global Body State
  if (document.body.style.cursor !== 'none') {
    console.warn('[Global] document.body.style.cursor is not "none". Ensure { hideCursor: true } is passed to Supermouse.');
  }

  // 3. Report
  if (issues.length > 0) {
    console.warn(`Found ${issues.length} potential conflicts:`);
    issues.forEach(i => console.warn(`[${i.reason}]`, i.el));
    console.info('Tip: Avoid setting "cursor: pointer" manually. Use plugins or "rules" config instead.');
  } else {
    console.log('✅ No obvious inline-style conflicts found.');
  }

  console.groupEnd();
}
