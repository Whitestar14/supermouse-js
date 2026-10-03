import { readFileSync } from "node:fs";

const stats = JSON.parse(readFileSync("./bundle-stats.json", "utf-8"));

const parts = stats.nodeParts ?? stats.parts ?? {};
const metas = stats.nodeMetas ?? stats.metas ?? {};

// Diagnostic: if the first thing we find looks like a hash, print the shape
// so we can adapt.
const sample = Object.entries(parts)[0];
if (sample) {
  const [uid, part] = sample;
  console.error("[debug] sample part:", { uid, keys: Object.keys(part), part });
  const metaUid = part.metaUid ?? uid;
  const meta = metas[metaUid];
  console.error("[debug] resolved meta:", meta);
}

const sizes = new Map();

for (const [uid, part] of Object.entries(parts)) {
  const metaUid = part.metaUid ?? uid;
  const meta = metas[metaUid] ?? metas[uid];
  const id = meta?.id ?? meta?.source ?? uid;

  const rendered = part.renderedLength ?? 0;
  const gzip = part.gzipLength ?? 0;

  if (!sizes.has(id)) sizes.set(id, { rendered: 0, gzip: 0 });
  const s = sizes.get(id);
  s.rendered += rendered;
  s.gzip += gzip;
}

// Strip workspace-internal path prefixes so the table stays narrow.
const short = (id) => {
  if (!id) return id;
  return id.replace(/^.*\/packages\/core\//, "").replace(/^.*\/node_modules\//, "node_modules/");
};

const rows = [...sizes.entries()]
  .filter(([id]) => id && !id.startsWith("\0"))
  .map(([id, s]) => [short(id), s])
  .sort((a, b) => b[1].rendered - a[1].rendered);

const totalRendered = rows.reduce((n, [, s]) => n + s.rendered, 0);
const totalGzip = rows.reduce((n, [, s]) => n + s.gzip, 0);

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

console.log(pad("module", 52), padL("rendered", 10), padL("gzip", 8), padL("%", 6));
console.log("-".repeat(80));

for (const [id, s] of rows.slice(0, 30)) {
  const pct = ((s.rendered / totalRendered) * 100).toFixed(1) + "%";
  console.log(
    pad(id.length > 50 ? "…" + id.slice(-49) : id, 52),
    padL(s.rendered, 10),
    padL(s.gzip, 8),
    padL(pct, 6)
  );
}

console.log("-".repeat(80));
console.log(pad("total", 52), padL(totalRendered, 10), padL(totalGzip, 8));
