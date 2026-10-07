// Build check: plays each build (docs/design/BUILD_TREE.md, data/builds.ts) solo with its identity items and reports
// whether its mechanic actually shows up (crits, falcon dives, procs, curses, misses) and how it compares on kill speed
// and deaths. usage: npm run build-check -- [minutes=10] [seed=1] [scenario …]
//   scenario: lv@zone:cls#build[+item,item][-]   '-' = no weapon (bare hands)   e.g. 50@desert:hunter#hu_fist-
import { World } from '../src/game/world.ts';
import { newGame, defaultLook, autoDistribute, learnSkill, addEquip, equip, newHero, defaultTactics } from '../src/game/state.ts';
import { SKILLS } from '../src/game/data/skills.ts';
import { ITEMS } from '../src/game/data/items.ts';
import { buildOf, BUILDS } from '../src/game/data/builds.ts';
import type { ClassId } from '../src/game/types.ts';

const minutes = Number(process.argv[2] ?? 10);
const seed0 = Number(process.argv[3] ?? 1);
const SECOND: Record<string, ClassId> = { swordsman: 'knight', mage: 'wizard', archer: 'hunter', acolyte: 'priest', thief: 'assassin', merchant: 'blacksmith' };
const WEAPON: Partial<Record<ClassId, string>> = { knight: 'w_claymore', wizard: 'w_staff', hunter: 'w_composite', priest: 'w_mace', assassin: 'w_jamadhar', blacksmith: 'w_battleaxe' };
const SPEAR_BUILDS = new Set(['kn_vit']);
const BARE = new Set(['hu_fist']);
const args = process.argv.slice(4);
const scenarios = args.length ? args : BUILDS.filter((b) => ['kn_crit', 'kn_agi', 'kn_vit', 'kn_bowl', 'hu_dex', 'hu_intblitz', 'hu_fist', 'hu_mob', 'as_crit', 'as_sonic', 'as_poison', 'bs_battle', 'bs_zeny', 'wz_intdex', 'pr_battle'].includes(b.id))
  .map((b) => `48@cave:${SECOND[b.line]}#${b.id}${BARE.has(b.id) ? "-" : ""}`);

console.log(`build check: ${minutes} min solo, seed ${seed0}`);
console.log('scenario                         kills/h  deaths  dmg/s   crit%  miss%  falcon/h  procs/h  curse/h  zeny spent');
for (const sc of scenarios) {
  const [head, rest] = sc.split(':');
  const [lvS, zone] = head.split('@');
  const lv = Number(lvS);
  const m = rest.match(/^([a-z]+)#([a-z_]+)((?:\+[a-z_]+)*)(-?)$/)!;
  const cls = m[1] as ClassId, buildId = m[2], extra = m[3] ? m[3].slice(1).split('+') : [], bare = m[4] === '-';
  let seed = seed0;
  const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const s = newGame('check', defaultLook('f'));
  s.heroes = []; s.partySlots = 1; s.stacks.u_red = 200; s.stacks.u_orange = 100; s.zeny = 2_000_000;
  const h = newHero(s, buildId, defaultLook('f'));
  h.cls = cls; h.baseLv = lv; h.jobLv = 30; h.build = buildId; h.statPts = 48 + lv * 5; autoDistribute(h);
  const b = buildOf(cls, buildId);
  // the build's own skills first (maxed), then attack skills, then the rest
  h.skillPts = 60;
  for (const id of b?.skills ?? []) for (let i = 0; i < 10; i++) learnSkill(h, id);
  for (const tier of [true, false]) for (let pass = 0; pass < 10 && h.skillPts > 0; pass++) {
    for (const x of Object.values(SKILLS)) if ((x.cls === cls || x.cls === sc.split('#')[0]) && (x.auto === 'attack' || x.auto === 'aoe') === tier && h.skillPts > 0) learnSkill(h, x.id);
  }
  const gear = [...(b?.items ?? []), ...extra].filter((id) => ITEMS[id]);
  const hasWeapon = gear.some((id) => ITEMS[id].loc === 'weapon');
  if (!bare && !hasWeapon) gear.unshift(SPEAR_BUILDS.has(buildId) ? 'w_pike' : WEAPON[cls] ?? 'w_knife');
  for (const id of gear) { const inst = addEquip(s, id); const e = equip(s, h, inst.uid); if (e) console.log(`  (${id}: ${e})`); }
  if (cls === 'hunter' && !bare) { s.stacks.am_arrow = 1; h.ammo = 'am_arrow'; }
  h.tactics = { ...defaultTactics(cls), role: 'auto' };
  s.heroes.push(h);
  s.zone = zone;
  if (!s.unlocked.includes(zone)) s.unlocked.push(zone);
  const w = new World(s, rng);

  const W = w as unknown as Record<string, (...a: unknown[]) => unknown> & { lastCrit: boolean };
  let dealt = 0, hits = 0, crits = 0, misses = 0, falcon = 0, procs = 0, curses = 0, deaths = 0;
  const wrap = (name: string, before: (...a: any[]) => void, after?: (r: unknown) => void) => {
    const f = W[name]; W[name] = function (this: unknown, ...a: unknown[]) { before(...a); const r = f.apply(this, a); after?.(r); return r; };
  };
  wrap('dealToMob', (_h, _t, n) => { dealt += n as number; });
  wrap('resolvePhys', () => {}, (r) => { if (r) { hits++; if (W.lastCrit) crits++; } else misses++; });
  wrap('falconStrike', () => { falcon++; });
  wrap('runProc', () => { procs++; });
  wrap('curseHero', () => { curses++; });
  const z0 = s.zeny, k0 = s.totals.kills;
  let wasDead = false;
  for (let ms = 0; ms < minutes * 60000; ms += 100) {
    w.advance(100);
    const dead = w.heroes[0].state === 'dead';
    if (dead && !wasDead) deaths++;
    wasDead = dead;
  }
  const hrs = minutes / 60;
  const row = [
    sc.padEnd(32), String(Math.round((s.totals.kills - k0) / hrs)).padStart(7), String(deaths).padStart(7), String(Math.round(dealt / (minutes * 60))).padStart(6),
    (hits ? (crits / hits * 100).toFixed(0) : '-').padStart(7), (hits + misses ? (misses / (hits + misses) * 100).toFixed(0) : '-').padStart(6),
    String(Math.round(falcon / hrs)).padStart(9), String(Math.round(procs / hrs)).padStart(8), String(Math.round(curses / hrs)).padStart(8), String(z0 - s.zeny > 0 ? z0 - s.zeny : 0).padStart(11),
  ];
  console.log(row.join(' '));
}
