// Content audit: drop tables, cards, item sources, weapon ladders, map economy.
// usage: node --experimental-strip-types tools/audit.ts [section]
//   sections: all (default) · errors · ladder · acc · head · cards · maps · econ · curve
import { MONSTERS, type MonsterDef } from '../src/game/data/monsters.ts';
import { ITEMS, SHOPS } from '../src/game/data/items.ts';
import { ZONES } from '../src/game/data/zones.ts';
import { sellPrice } from '../src/game/state.ts';
import type { GameState, WeaponType } from '../src/game/types.ts';

const want = process.argv[2] ?? 'all';
const on = (s: string) => want === 'all' || want === s;
const errors: string[] = [];
const warn: string[] = [];

// ── sources
const shopItems = new Set(Object.values(SHOPS).flatMap((s) => s.items));
const dropsOf: Record<string, { mob: string; rate: number; slots?: number }[]> = {};
for (const m of Object.values(MONSTERS)) for (const d of m.drops) (dropsOf[d.id] ??= []).push({ mob: m.id, rate: d.rate, slots: d.slots });
const mobZones: Record<string, string[]> = {};
for (const z of ZONES) {
  for (const e of z.mobs) (mobZones[e.id] ??= []).push(z.id);
  if (z.boss) (mobZones[z.boss] ??= []).push(z.id + '(B)');
  if (z.mvp) (mobZones[z.mvp] ??= []).push(z.id + '(MVP)');
}
const summoned = new Set(Object.values(MONSTERS).flatMap((m) => (m.skills ?? []).map((s) => s.summon).filter(Boolean) as string[]));
const fmtRate = (r: number) => (r >= 0.01 ? (r * 100).toFixed(r >= 0.1 ? 0 : 1) + '%' : (r * 100).toFixed(r >= 0.001 ? 2 : 3) + '%');
const srcText = (id: string) => [
  ...(dropsOf[id] ?? []).map((d) => `${MONSTERS[d.mob].name}${d.slots ? `[${d.slots}]` : ''} ${fmtRate(d.rate)}`),
  ...(shopItems.has(id) ? ['상점'] : []),
].join(', ');

// ── integrity
for (const m of Object.values(MONSTERS)) {
  const cards = m.drops.filter((d) => ITEMS[d.id]?.kind === 'card');
  if (cards.length !== 1 || cards[0].id !== 'c_' + m.id) errors.push(`${m.id}: card drops = ${cards.map((c) => c.id).join(',') || 'none'}`);
  for (const d of m.drops) if (!ITEMS[d.id]) errors.push(`${m.id}: unknown drop ${d.id}`);
  for (const d of m.drops) if (d.slots && ITEMS[d.id]?.kind !== 'equip') errors.push(`${m.id}: slots on non-equip ${d.id}`);
  if (!mobZones[m.id] && !summoned.has(m.id)) errors.push(`${m.id}: lives in no zone`);
  for (const s of m.skills ?? []) if (s.summon && !MONSTERS[s.summon]) errors.push(`${m.id}: summons unknown ${s.summon}`);
  const etc = m.drops.filter((d) => ITEMS[d.id]?.kind === 'etc' && !d.id.startsWith('r_') && !d.id.startsWith('q_'));
  // a mob owns an etc item when it is that item's main source (highest rate), e.g. 말랑 → 젤리 조각
  const own = etc.filter((d) => dropsOf[d.id].every((o) => o.mob === m.id || o.rate < d.rate));
  if (!own.length) warn.push(`${m.id}: no etc item of its own (${etc.map((d) => d.id).join(',')})`);
}
for (const it of Object.values(ITEMS)) {
  if (it.kind === 'card') {
    const mob = it.id.slice(2);
    if (!MONSTERS[mob]) errors.push(`${it.id}: card of unknown monster`);
    if (!it.cardLoc) errors.push(`${it.id}: no cardLoc`);
  }
  if (it.kind === 'equip' && !it.loc) errors.push(`${it.id}: equip without loc`);
  if (it.kind !== 'card' && !dropsOf[it.id] && !shopItems.has(it.id)) warn.push(`dead item (no drop, no shop): ${it.id} ${it.name}`);
}
for (const z of ZONES) {
  for (const e of z.mobs) if (!MONSTERS[e.id]) errors.push(`${z.id}: unknown mob ${e.id}`);
  if (z.boss && MONSTERS[z.boss]?.boss !== 'field') errors.push(`${z.id}: boss ${z.boss} is not a field boss`);
  if (z.mvp && MONSTERS[z.mvp]?.boss !== 'mvp') errors.push(`${z.id}: mvp ${z.mvp} is not an MVP`);
  if (z.unlockBy) {
    const u = ZONES.find((x) => x.id === z.unlockBy);
    if (!u) errors.push(`${z.id}: unlockBy unknown ${z.unlockBy}`);
    else if (!u.boss) errors.push(`${z.id}: unlockBy ${u.id} has no field boss`);
  }
  if (z.id !== 'town' && z.id !== 'meadow' && !z.unlockBy && !z.gate) errors.push(`${z.id}: unreachable (no unlockBy, no gate)`);
  const g = z.gate;
  if (g) {
    if (g.clue && !ITEMS[g.clue]) errors.push(`${z.id}: clue ${g.clue} unknown`);
    if (g.clue && !ITEMS[g.clue].rarity) errors.push(`${z.id}: clue ${g.clue} has no rarity (would be auto-sold)`);
    if (!g.openText) errors.push(`${z.id}: gate without openText`);
    for (const n of g.need) {
      if (n.kind === 'item' && !ITEMS[n.id]) errors.push(`${z.id}: gate item ${n.id} unknown`);
      if (n.kind === 'item' && !ITEMS[n.id].rarity) errors.push(`${z.id}: gate item ${n.id} has no rarity`);
      if ((n.kind === 'kills' || n.kind === 'boss' || n.kind === 'card') && !MONSTERS[n.mob]) errors.push(`${z.id}: gate mob ${n.mob} unknown`);
      if (n.kind === 'hours' && ((n.to - n.from + 24) % 24) < 4) errors.push(`${z.id}: hours window < 4h`);
    }
    if (g.hidden && !g.clue && g.need[0]?.kind === 'hours') errors.push(`${z.id}: hidden map whose first need is hours`);
  }
  for (const id of z.specialty ?? []) if (!ITEMS[id] || !dropsOf[id]) errors.push(`${z.id}: specialty ${id} unknown or not dropped`);
  if (z.boss === undefined && z.bossGauge) warn.push(`${z.id}: bossGauge without boss`);
}
// regions: ≥1 field boss and ≥1 MVP
const regions = new Map<string, { boss: number; mvp: number; maps: string[] }>();
for (const z of ZONES) {
  if (!z.region || z.id === 'town') continue;
  const r = regions.get(z.region) ?? { boss: 0, mvp: 0, maps: [] };
  if (z.boss) r.boss++;
  if (z.mvp) r.mvp++;
  r.maps.push(z.id);
  regions.set(z.region, r);
}
for (const [name, r] of regions) if (!r.boss || !r.mvp) errors.push(`region ${name}: boss ${r.boss}, mvp ${r.mvp}`);

if (on('errors') || want === 'all') {
  console.log(`== integrity: ${Object.keys(MONSTERS).length} monsters, ${Object.values(ITEMS).filter((i) => i.kind === 'card').length} cards, ${ZONES.length} zones, ${Object.keys(ITEMS).length} items`);
  console.log(errors.length ? 'ERRORS:\n  ' + errors.join('\n  ') : 'no errors');
  if (warn.length) console.log('warnings:\n  ' + warn.join('\n  '));
}

// ── weapon ladders
if (on('ladder')) {
  console.log('\n== weapon ladders (reqLv · wlv · atk/matk · sources)');
  const types: WeaponType[] = ['dagger', 'sword', 'sword2h', 'spear', 'katar', 'bow', 'staff', 'mace', 'axe'];
  for (const t of types) {
    console.log(`  [${t}]`);
    const ws = Object.values(ITEMS).filter((i) => i.wtype === t).sort((a, b) => (a.reqLv ?? 1) - (b.reqLv ?? 1) || (a.atk ?? 0) - (b.atk ?? 0));
    for (const w of ws) console.log(`    Lv${String(w.reqLv ?? 1).padStart(2)} w${w.wlv} ${String(w.atk).padStart(3)}${w.matkPct ? ` m${w.matkPct}%` : ''}${w.element ? ' ' + w.element : ''}  ${w.id.padEnd(15)} ${w.name.padEnd(10)} ← ${srcText(w.id) || '없음!'}`);
  }
  console.log('\n== armor / shield / garment / shoes');
  for (const loc of ['armor', 'shield', 'garment', 'shoes'] as const) {
    console.log(`  [${loc}]`);
    for (const a of Object.values(ITEMS).filter((i) => i.loc === loc).sort((a, b) => (a.reqLv ?? 1) - (b.reqLv ?? 1)))
      console.log(`    Lv${String(a.reqLv ?? 1).padStart(2)} def${String(a.def).padStart(2)}  ${a.id.padEnd(15)} ${a.name.padEnd(10)} ← ${srcText(a.id) || '없음!'}`);
  }
}
if (on('acc')) {
  console.log('\n== accessories');
  for (const a of Object.values(ITEMS).filter((i) => i.loc === 'acc')) console.log(`  ${a.id.padEnd(14)} ${a.name.padEnd(8)} ${a.desc.split('.').pop()?.trim()}  ← ${srcText(a.id)}`);
}
if (on('head')) {
  console.log('\n== headgear');
  for (const a of Object.values(ITEMS).filter((i) => i.loc?.startsWith('head'))) console.log(`  ${a.loc!.padEnd(7)} ${a.look!.padEnd(10)} ${a.id.padEnd(14)} ${a.name.padEnd(10)} ← ${srcText(a.id) || '없음!'}`);
}
if (on('cards')) {
  console.log('\n== cards by slot');
  for (const loc of ['weapon', 'armor', 'shield', 'garment', 'shoes', 'acc', 'head']) {
    console.log(`  [${loc}]`);
    for (const c of Object.values(ITEMS).filter((i) => i.kind === 'card' && i.cardLoc === loc)) {
      const m = MONSTERS[c.id.slice(2)];
      const rate = m.drops.find((d) => d.id === c.id)!.rate;
      console.log(`    ${c.name.padEnd(12)} Lv${String(m.lv).padStart(2)} ${fmtRate(rate).padStart(6)} ${(c.rarity ?? '').padEnd(5)} ${c.desc.split('\n').slice(0, -1).join(' / ')}  @${(mobZones[m.id] ?? ['summon']).join(',')}`);
    }
  }
}

// ── economy: expected zeny (sold etc + equipment at sell price) and exp per kill, per map
const fake = { heroes: [] } as unknown as GameState;
function perKill(m: MonsterDef) {
  let etc = 0, eq = 0, ore = 0;
  for (const d of m.drops) {
    const it = ITEMS[d.id];
    if (it.kind === 'etc' && !d.id.startsWith('r_') && !d.id.startsWith('q_')) etc += d.rate * sellPrice(fake, d.id);
    else if (it.kind === 'equip') eq += Math.min(1, d.rate) * sellPrice(fake, d.id);
    else if (d.id === 'r_ori' || d.id === 'r_elu') ore += d.rate;
  }
  return { etc, eq, ore };
}
if (on('econ') || on('maps')) {
  console.log('\n== maps: band · role · avg mob lv · exp/kill · zeny/kill (etc + equip) · ori+elu per 1000 kills · cards per 1000 kills');
  for (const z of ZONES) {
    if (!z.mobs.length) continue;
    const tot = z.mobs.reduce((a, e) => a + e.w, 0);
    let lv = 0, exp = 0, etc = 0, eq = 0, ore = 0, card = 0;
    for (const e of z.mobs) {
      const m = MONSTERS[e.id], f = e.w / tot, k = perKill(m);
      lv += m.lv * f; exp += m.exp * f; etc += k.etc * f; eq += k.eq * f; ore += k.ore * f;
      card += (m.drops.find((d) => d.id === 'c_' + m.id)?.rate ?? 0) * f;
    }
    console.log(`  ${z.id.padEnd(12)} ${String(z.lv[0]).padStart(2)}-${String(z.lv[1]).padEnd(2)} ${(z.role ?? []).join('/').padEnd(9)} mobLv${lv.toFixed(0).padStart(3)} exp${Math.round(exp).toString().padStart(6)} zeny${Math.round(etc).toString().padStart(5)}+${Math.round(eq).toString().padStart(4)} ore${(ore * 1000).toFixed(1).padStart(5)} cards${(card * 1000).toFixed(1).padStart(4)}`);
  }
}
// ── stat curve outliers (normal mobs): HP and ATK vs a smooth curve by level
if (on('curve')) {
  console.log('\n== normal mob HP / ATK vs curve (pre-trim HP ≈ 1.6·lv², atk ≈ lv·(1.6+0.045·lv))');
  const trim = (lv: number) => (lv >= 45 ? 0.75 : lv >= 28 ? 0.65 : lv >= 14 ? 0.8 : 1);
  for (const m of Object.values(MONSTERS).filter((m) => !m.boss).sort((a, b) => a.lv - b.lv)) {
    const hpC = 1.6 * m.lv * m.lv * trim(m.lv), atkC = m.lv * (1.6 + 0.045 * m.lv);
    const hr = m.hp / Math.max(30, hpC), ar = (m.atk[0] + m.atk[1]) / 2 / atkC;
    const flag = hr > 1.6 || hr < 0.6 || ar > 1.3 || ar < 0.75 ? '  <<' : '';
    console.log(`  Lv${String(m.lv).padStart(2)} ${m.id.padEnd(13)} hp ${String(m.hp).padStart(6)} (${hr.toFixed(2)})  atk ${(m.atk[0] + m.atk[1]) / 2} (${ar.toFixed(2)})  def ${m.def} flee ${m.lv + m.agi} exp ${m.exp}${flag}`);
  }
}
