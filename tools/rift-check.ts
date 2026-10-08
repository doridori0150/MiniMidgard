// Rift check (균열, docs/design/ENDGAME.md §3, src/game/rift.ts): a Lv ~62 2nd-job party plays rift runs back to back
// with auto-retry 「최고 단계 도전」 and reports, per hour, the tier reached, clears / fails, clear times, wipes, levels and how
// the gear grades climb. With `loot` the party wears rift drops when they beat what it has (a DPS × toughness score
// against a monster of the current tier); `noloot` keeps the starting gear (where the first wall is without 고대 gear).
// usage: npm run rift-check -- [hours=4] [seed=1] [loot|noloot|both] [lineup …]
//   lineup: name=cls#build,cls#build,cls#build   e.g. phys=knight#kn_vit,assassin#as_crit,priest#pr_support
// Keep runs short: it plays every monster in real time on the efficiency cores (taskpolicy -b in the npm script).
import { World, type RiftRun } from '../src/game/world.ts';
import { newGame, defaultLook, autoDistribute, learnSkill, learnPath, autoFillSlots, addEquip, equip, newHero, defaultTactics, canEquip, equippedBy } from '../src/game/state.ts';
import { SKILLS } from '../src/game/data/skills.ts';
import { ITEMS } from '../src/game/data/items.ts';
import { lineage } from '../src/game/data/classes.ts';
import { buildOf } from '../src/game/data/builds.ts';
import { computeDerived } from '../src/game/stats.ts';
import { elementMod, sizeMod } from '../src/game/data/elements.ts';
import { gradeOf, GRADE_ORDER, GRADE_KO, type Grade } from '../src/game/gear.ts';
import { ESSENCE, riftLevel, riftSave, RULES, type RiftRuleId } from '../src/game/rift.ts';
import type { ClassId, EquipSlot, GameState, Hero } from '../src/game/types.ts';

const hours = Number(process.argv[2] ?? 4);
const seed0 = Number(process.argv[3] ?? 1);
const mode = process.argv[4] ?? 'both';
const LV = 62;
const DEFAULT = [
  'phys=knight#kn_vit,assassin#as_crit,priest#pr_support',
  'mixed=knight#kn_vit,wizard#wz_storm,priest#pr_support',
  'fixed=hunter#hu_intblitz,wizard#wz_intdex,priest#pr_support',
];
const lineups = process.argv.slice(5).length ? process.argv.slice(5) : DEFAULT;
/** a Lv 60-ish party's kit: the strongest common weapon of the line (+5), class armour and plain shop pieces (+4) */
const KIT: Partial<Record<ClassId, string[]>> = {
  knight: ['w_lance', 'a_knight'], priest: ['w_goldmace', 'a_priest', 's_mirror'], wizard: ['w_frostrod', 'a_wizard'],
  assassin: ['w_jur', 'a_assassin'], hunter: ['w_huntbow', 'a_hunter'], blacksmith: ['w_titanaxe', 'a_smith'],
};
const COMMON = ['g_feather', 'f_greaves', 'h_cap'];

function makeParty(spec: string) {
  const s = newGame('check', defaultLook('f'));
  s.heroes = []; s.partySlots = 3; s.zeny = 500000;
  s.stacks.u_white = 400; s.stacks.u_yellow = 300; s.stacks.u_blue = 100; s.stacks.am_arrow = 1;
  s.stacks.k_bluegem = 200; s.stacks.k_redgem = 200; s.stacks.k_trap = 800; s.stacks.k_holywater = 50;
  s.quick[0] = { id: 'u_white', auto: true, pct: 45 };
  s.quick[1] = { id: 'u_blue', auto: true, pct: 15 };
  spec.split(',').forEach((x, i) => {
    const [cls, build] = x.split('#') as [ClassId, string | undefined];
    const h = newHero(s, `${cls}${i}`, defaultLook(i % 2 ? 'm' : 'f'));
    h.cls = cls; h.baseLv = LV; h.jobLv = 30; h.build = build; h.statPts = 48 + LV * 5; autoDistribute(h);
    h.skillPts = 75;
    const main = (k: { auto: string }) => k.auto === 'attack' || k.auto === 'aoe' || k.auto === 'heal' || k.auto === 'revive';
    const line = lineage(cls);
    for (const tier of [true, false]) for (let pass = 0; pass < 10 && h.skillPts > 0; pass++) {
      for (const k of Object.values(SKILLS)) if (line.includes(k.cls as ClassId) && main(k) === tier && h.skillPts > 0) learnPath(h, k.id, (h.skills[k.id] ?? 0) + 1);
    }
    for (const id of [...(KIT[cls] ?? []), ...COMMON]) {
      if (!ITEMS[id] || canEquip(h, id)) continue;
      const inst = addEquip(s, id);
      inst.refine = ITEMS[id].loc === 'weapon' ? 5 : 4;
      equip(s, h, inst.uid);
    }
    if (cls === 'hunter') h.ammo = 'am_arrow';
    h.tactics = { ...defaultTactics(cls), role: 'auto' };
    autoFillSlots(h, buildOf(cls, build)?.skills ?? []);
    s.heroes.push(h);
  });
  s.unlocked.push('desert'); s.zone = 'town';
  return s;
}

/** DPS × toughness against a plain monster of this tier (the sim's gear policy, as sim.ts power() but for the rift) */
function power(s: GameState, h: Hero, tier: number): number {
  const d = computeDerived(s, h);
  const lv = riftLevel(tier);
  const m = { lv, def: 30, mdef: 25, agi: lv * 0.9, dex: lv * 1.4, luk: 0, race: 'brute' as const, size: 'medium' as const, element: 'neutral' as const };
  const b = d.b;
  const magic = lineage(h.cls).includes('mage');
  const healer = lineage(h.cls).includes('acolyte') && h.stats.int > h.stats.str;
  let off: number;
  if (magic) off = (d.matkMin + d.matkMax) / 2 * (1 + (b.raceDmg?.[m.race] ?? 0) / 100) * (100 - m.mdef) / 100 / Math.max(0.3, d.castMul + 0.4);
  else {
    const base = d.statusAtk + d.watk * (b.ignoreSize ? 1 : sizeMod(d.wtype, m.size)) * 0.85 + d.ammoAtk + d.bonusAtk;
    const mult = (1 + (b.atkPct ?? 0) / 100) * (1 + (b.raceDmg?.[m.race] ?? 0) / 100) * (1 + (b.sizeDmg?.[m.size] ?? 0) / 100) * elementMod(d.weaponElement, m.element);
    const hit = Math.min(1, Math.max(0.05, (80 + d.hit - (m.lv + m.agi)) / 100));
    const crit = Math.min(1, Math.max(0, d.crit / 100));
    off = ((base * mult * (100 - m.def) / 100 + d.refineAtk) * hit * (1 - crit) + base * mult * 1.4 * (1 + (b.critDmgPct ?? 0) / 100) * crit) * 1000 / d.delay;
  }
  if (healer) off = off * 0.4 + (d.total.int + h.baseLv) * 6 * (1 + (b.healPct ?? 0) / 100);
  const mobHit = Math.min(0.95, Math.max(0.05, (80 + m.lv + m.dex - d.flee) / 100));
  const ehp = (d.maxHp + d.total.vit * 4) / (Math.max(0.05, mobHit) * (100 - d.def) / 100 * (1 - (b.dmgReducePct ?? 0) / 100));
  return off * Math.pow(ehp, 0.5);
}

function wearLoot(s: GameState, w: World, tier: number) {
  for (const h of s.heroes) {
    let cur = power(s, h, tier);
    for (let pass = 0; pass < 4; pass++) {
      let best: { uid: number; slot?: EquipSlot; p: number } | null = null;
      for (const inst of s.equips) {
        if (!inst.rift || equippedBy(s, inst.uid) || canEquip(h, inst.id)) continue;
        for (const slot of ITEMS[inst.id].loc === 'acc' ? (['acc1', 'acc2'] as EquipSlot[]) : [undefined]) {
          const keep = { ...h.equip };
          equip(s, h, inst.uid, slot);
          const p = power(s, h, tier);
          // undo
          for (const k of Object.keys(h.equip) as EquipSlot[]) delete h.equip[k];
          Object.assign(h.equip, keep);
          if (p > cur * 1.01 && (!best || p > best.p)) best = { uid: inst.uid, slot, p };
        }
      }
      if (!best) break;
      equip(s, h, best.uid, best.slot);
      cur = best.p;
    }
  }
  // sell rift pieces nobody wears (keeps the bag small for the scan)
  s.equips = s.equips.filter((e) => !e.rift || equippedBy(s, e.uid));
  w.syncParty();
}

function levelUp(s: GameState) {
  for (const h of s.heroes) {
    autoDistribute(h);
    for (let g = 0; g < 20 && h.skillPts > 0; g++) {
      const k = Object.values(SKILLS).find((x) => lineage(h.cls).includes(x.cls as ClassId) && learnSkill(h, x.id));
      if (!k) break;
    }
    autoFillSlots(h, buildOf(h.cls, h.build)?.skills ?? []);
  }
}

const gradeTally = () => Object.fromEntries(GRADE_ORDER.map((g) => [g, 0])) as Record<Grade, number>;
const fmtT = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

console.log(`rift check: ${hours} h per line-up, Lv ${LV} 2nd-job party, auto 최고 단계 도전, seed ${seed0}`);
for (const spec of lineups) {
  const [name, list] = spec.includes('=') ? spec.split('=') : [spec, spec];
  for (const loot of mode === 'both' ? [false, true] : [mode === 'loot']) {
    let seed = seed0;
    const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const s = makeParty(list);
    const w = new World(s, rng);
    w.fx = false;
    w.clock = () => new Date(2026, 9, 8, 12, 0); // a fixed week: the same decade rules in every run
    const rs = riftSave(s);
    rs.auto = 'push';
    const got = gradeTally();
    const runs: { tier: number; ok: boolean; ms: number; why: string; rules: string[] }[] = [];
    w.onRiftEnd = (r: RiftRun) => {
      runs.push({ tier: r.plan.tier, ok: r.result!.ok, ms: r.result!.ms, why: r.result!.why, rules: r.plan.rules });
      for (const g of r.loot) got[g as Grade]++;
      levelUp(s);
      if (loot) wearLoot(s, w, rs.open);
    };
    const e = w.startRift();
    if (e) { console.log(`${name}: ${e}`); continue; }
    const t0 = performance.now();
    console.log(`\n── ${name} (${list}) · ${loot ? 'loot: wears rift drops' : 'noloot: starting gear'}`);
    let wipes0 = 0;
    for (let hr = 1; hr <= hours; hr++) {
      for (let sec = 0; sec < 3600; sec++) w.advance(1000);
      const eq = gradeTally();
      const ilv: number[] = [];
      for (const h of s.heroes) for (const uid of new Set(Object.values(h.equip))) { const inst = s.equips.find((x) => x.uid === uid); if (inst) { eq[gradeOf(inst)]++; if (inst.rift) ilv.push(inst.ilvl ?? 0); } }
      const wipes = s.totals.deaths - wipes0; wipes0 = s.totals.deaths;
      const clearsAt = (t: number) => runs.filter((r) => r.tier === t && r.ok).map((r) => fmtT(r.ms));
      console.log(`  ${String(hr).padStart(2)}h  best ${String(rs.best).padStart(3)}  open ${String(rs.open).padStart(3)}  runs ${rs.runs} (clears ${rs.clears})  wipes ${wipes}`
        + `  lv ${s.heroes.map((h) => h.baseLv).join('/')}  정수 ${s.stacks[ESSENCE] ?? 0}`
        + `  | wearing ${GRADE_ORDER.filter((g) => eq[g]).map((g) => `${GRADE_KO[g]} ${eq[g]}`).join(' · ')}${ilv.length ? ` (rift ilvl ~${Math.round(ilv.reduce((a, b) => a + b, 0) / ilv.length)})` : ''}`
        + `  | best-tier clears ${clearsAt(rs.best).join(',') || '-'}`);
    }
    // the wall: the tier where the last runs kept failing, with why and the rules that beat it
    const fails = runs.filter((r) => !r.ok);
    const top = runs.reduce((a, r) => Math.max(a, r.tier), 0);
    const atTop = runs.filter((r) => r.tier === top);
    console.log(`  runs: ${runs.length}, ${runs.filter((r) => r.ok).length} cleared · tiers climbed ${runs.filter((r) => r.ok).map((r) => r.tier).join(' ')}`);
    console.log(`  fails: ${fails.length} — ${[...new Set(fails.map((r) => r.why))].map((why) => `${why} ${fails.filter((f) => f.why === why).length}`).join(', ')}`);
    console.log(`  at tier ${top}: ${atTop.filter((r) => r.ok).length}/${atTop.length} cleared; rules there: ${atTop.map((r) => r.rules.map((x) => RULES[x as RiftRuleId].name).join('+') + (r.ok ? '✓' : '✗')).join(' | ')}`);
    console.log(`  rift gear dropped: ${GRADE_ORDER.filter((g) => got[g]).map((g) => `${GRADE_KO[g]} ${got[g]}`).join(' · ')}  (${((performance.now() - t0) / 1000).toFixed(0)}s)`);
  }
}
