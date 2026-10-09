// Copy the reviewed hero sprite delivery into the game: docs/art-production/hero-sprites/ → src/assets/sprites/.
// Every character, weapon and headgear in the production game-manifest.json is copied with its frames, hair masks and
// grip overlays; the game manifest keeps only what src/render/whole.ts reads (no source/scale records).
// usage: node tools/sync-hero-sprites.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const from = path.join(root, 'docs/art-production/hero-sprites');
const to = path.join(root, 'src/assets/sprites');
const dry = process.argv.includes('--dry');
const prod = JSON.parse(fs.readFileSync(path.join(from, 'game-manifest.json'), 'utf8'));

const out = { schema: prod.schema, canvas: prod.canvas, animations: prod.animations, characters: {}, weapons: {}, headgear: prod.headgear, hairTints: prod.hairTints, renderContract: prod.renderContract };
const files = new Set();
for (const [id, c] of Object.entries(prod.characters)) {
  const { frames, ...rest } = c;
  out.characters[id] = { ...rest, frames: {} };
  for (const [state, f] of Object.entries(frames)) {
    const { source, uniform_scale, ...keep } = f;
    out.characters[id].frames[state] = keep;
    for (const file of [f.image, f.hairMask, f.gripOverlay]) if (file) files.add(file);
  }
}
for (const [id, w] of Object.entries(prod.weapons)) { out.weapons[id] = { image: w.image, pivot: w.pivot, ...(w.tip ? { tip: w.tip } : {}) }; files.add(w.image); }
for (const h of Object.values(prod.headgear)) files.add(h.image);

const missing = [...files].filter((f) => !fs.existsSync(path.join(from, f)));
if (missing.length) { console.error('missing in delivery:', missing.join(', ')); process.exit(1); }

let changed = 0;
for (const f of files) {
  const src = path.join(from, f), dst = path.join(to, f);
  const same = fs.existsSync(dst) && fs.readFileSync(dst).equals(fs.readFileSync(src));
  if (same) continue;
  changed++;
  if (!dry) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
}
// drop game copies the delivery no longer has
const stale = [];
for (const dir of ['frames', 'masks', 'grips', 'equipment']) {
  const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
  for (const abs of walk(path.join(to, dir))) { const rel = path.relative(to, abs); if (!files.has(rel)) stale.push(rel); }
}
if (!dry) {
  for (const rel of stale) fs.rmSync(path.join(to, rel));
  fs.writeFileSync(path.join(to, 'manifest.json'), JSON.stringify(out, null, 2) + '\n');
}
console.log(`${dry ? '[dry] ' : ''}${Object.keys(out.characters).join(', ')} · weapons ${Object.keys(out.weapons).join(', ')} — ${changed} file(s) updated, ${stale.length} removed`);
