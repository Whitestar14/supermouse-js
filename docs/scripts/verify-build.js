import fs from 'node:fs';
import path from 'node:path';

const distPath = path.resolve(process.cwd(), 'dist');
const cnamePath = path.resolve(distPath, 'CNAME');
const sitemapPath = path.resolve(distPath, 'sitemap.xml');

console.log('[!] Verifying SSG Build Output...');

const checks = [
  {
    name: 'CNAME file',
    path: cnamePath,
    expected: 'supermouse.js.org'
  },
  {
    name: 'Sitemap',
    path: sitemapPath
  }
];

let failed = false;

checks.forEach(check => {
  if (fs.existsSync(check.path)) {
    console.log(`[^] ${check.name} exists.`);
    if (check.expected) {
      const content = fs.readFileSync(check.path, 'utf8').trim();
      if (content === check.expected) {
        console.log(`   [^] Content matches: ${content}`);
      } else {
        console.error(`   [x] Content mismatch! Expected "${check.expected}", got "${content}"`);
        failed = true;
      }
    }
  } else {
    console.error(`   [x] ${check.name} is MISSING at ${check.path}`);
    failed = true;
  }
});

if (failed) {
  console.error('\n[!!] Build verification failed. Check your public folder and vite.config.ts.');
  process.exit(1);
} else {
  console.log('\n[^] Build is SEO-ready and JS.ORG compliant!');
}